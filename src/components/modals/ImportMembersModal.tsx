/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Edit2,
  Check,
  Trash2,
} from 'lucide-react';
import { Member, MembershipPlan } from '../../types/dashboard';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  plans: MembershipPlan[];
  onConfirmImport: (
    rows: Array<
      Omit<Member, 'id'> & {
        initialPaidAmount?: number;
        paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
      }
    >
  ) => { importedCount: number; skippedDuplicatesCount: number };
}

interface ParsedImportRow {
  rowIndex: number;
  name: string;
  phone: string;
  email: string;
  membershipPlan: string;
  planFee: string;
  startDate: string; // normalized YYYY-MM-DD or original if invalid
  expiryDate: string; // normalized YYYY-MM-DD or original if invalid
  pendingAmount: number;
  skipRow: boolean;
  isEditing?: boolean;
}

function getLocalIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Normalizes a date value (string, Excel serial number, DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY)
 * into ISO YYYY-MM-DD, or returns null if invalid.
 */
function parseFlexibleDateToIso(rawVal: unknown): string | null {
  if (rawVal === undefined || rawVal === null || rawVal === '') return null;

  // Excel serial number (e.g. 45580)
  if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 80000) {
    const utcDays = Math.floor(rawVal - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return getLocalIso(d);
    }
  }

  const str = String(rawVal).trim();
  if (!str) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (
      dt.getFullYear() === y &&
      dt.getMonth() === m - 1 &&
      dt.getDate() === d
    ) {
      return getLocalIso(dt);
    }
    return null;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() === year &&
      dt.getMonth() === month - 1 &&
      dt.getDate() === day
    ) {
      return getLocalIso(dt);
    }
    return null;
  }

  // Natural date string e.g. "15 Nov 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= 2100) {
    return getLocalIso(parsed);
  }

  return null;
}

function addMonthsToIso(startIso: string, months: number): string {
  const dt = new Date(startIso + 'T00:00:00');
  if (isNaN(dt.getTime())) return getLocalIso();
  dt.setMonth(dt.getMonth() + months);
  return getLocalIso(dt);
}

function inferMonthsFromPlan(planName: string): number {
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12') || lower.includes('year')) return 12;
  if (lower.includes('6') || lower.includes('half')) return 6;
  if (lower.includes('3') || lower.includes('quarter')) return 3;
  return 1;
}

function inferFeeFromPlan(planName: string, plans: MembershipPlan[]): string {
  const matched = plans.find(
    (p) => p.name.toLowerCase() === (planName || '').trim().toLowerCase()
  );
  if (matched) return `₹${matched.price.toLocaleString('en-IN')}`;
  const lower = (planName || '').toLowerCase();
  if (lower.includes('annual') || lower.includes('12')) return '₹14,000';
  if (lower.includes('6') || lower.includes('half')) return '₹9,000';
  if (lower.includes('3') || lower.includes('quarter')) return '₹5,500';
  return '₹2,000';
}

export const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  plans,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'ready' | 'attention' | 'duplicate'>('all');
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    skippedCount: number;
    attentionSkippedCount: number;
  } | null>(null);

  const existingPhoneSet = useMemo(() => {
    const s = new Set<string>();
    existingMembers.forEach((m) => {
      const clean = (m.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (clean.length === 10) s.add(clean);
    });
    return s;
  }, [existingMembers]);

  const existingNamePhoneSet = useMemo(() => {
    const s = new Set<string>();
    existingMembers.forEach((m) => {
      const clean = (m.phone || '').replace(/[^0-9]/g, '').slice(-10);
      s.add(`${m.name.trim().toLowerCase()}|${clean}`);
    });
    return s;
  }, [existingMembers]);

  // Evaluate validation status for every row
  const evaluatedRows = useMemo(() => {
    const seenPhonesInFile = new Set<string>();
    return rows.map((r) => {
      const issues: string[] = [];
      const cleanName = r.name.trim();
      const digits = r.phone.replace(/[^0-9]/g, '');
      const clean10 =
        digits.length === 12 && digits.startsWith('91')
          ? digits.slice(2)
          : digits.length === 11 && digits.startsWith('0')
          ? digits.slice(1)
          : digits;

      if (!cleanName) {
        issues.push('Missing member name');
      }
      if (!/^[6-9]\d{9}$/.test(clean10)) {
        issues.push('Invalid 10-digit Indian phone');
      }

      const validStart = parseFlexibleDateToIso(r.startDate);
      const validExpiry = parseFlexibleDateToIso(r.expiryDate);
      if (!validStart) {
        issues.push('Invalid joining date');
      }
      if (!validExpiry) {
        issues.push('Invalid expiry date');
      }

      const isDuplicateExisting =
        clean10.length === 10 &&
        (existingPhoneSet.has(clean10) ||
          existingNamePhoneSet.has(`${cleanName.toLowerCase()}|${clean10}`));
      const isDuplicateInFile =
        clean10.length === 10 && seenPhonesInFile.has(clean10);

      if (clean10.length === 10) {
        seenPhonesInFile.add(clean10);
      }

      const isDuplicate = isDuplicateExisting || isDuplicateInFile;
      let status: 'ready' | 'duplicate' | 'attention' = 'ready';
      if (isDuplicate) {
        status = 'duplicate';
      } else if (issues.length > 0) {
        status = 'attention';
      }

      return {
        ...r,
        clean10,
        validStart,
        validExpiry,
        issues,
        isDuplicateExisting,
        isDuplicateInFile,
        status,
      };
    });
  }, [rows, existingPhoneSet, existingNamePhoneSet]);

  const counts = useMemo(() => {
    let readyCount = 0;
    let duplicateCount = 0;
    let attentionCount = 0;
    evaluatedRows.forEach((r) => {
      if (r.skipRow || r.status === 'duplicate') {
        duplicateCount++;
      } else if (r.status === 'attention') {
        attentionCount++;
      } else {
        readyCount++;
      }
    });
    return { readyCount, duplicateCount, attentionCount };
  }, [evaluatedRows]);

  if (!isOpen) return null;

  const handleDownloadSampleCsv = () => {
    const todayIso = getLocalIso();
    const exp1M = addMonthsToIso(todayIso, 1);
    const exp3M = addMonthsToIso(todayIso, 3);
    const sampleCsv = [
      'Member Name,Phone Number,Email,Membership Plan,Plan Fee,Joining Date,Expiry Date,Pending Amount',
      `Aarav Sharma,9876543210,aarav@example.com,Monthly Plan,2000,${todayIso},${exp1M},0`,
      `Priya Nair,9812345678,priya@example.com,Quarterly Plan,5500,${todayIso},${exp3M},500`,
    ].join('\n');

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gym_members_sample_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportSummary(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setParseError('The selected file contains no sheets or rows.');
        setRows([]);
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: '',
      });

      if (!rawJson || rawJson.length === 0) {
        setParseError(
          'No member records found in the file. Ensure the first row contains column headers (e.g., Name, Phone, Plan, Joining Date, Expiry Date).'
        );
        setRows([]);
        return;
      }

      const todayIso = getLocalIso();
      const mapped: ParsedImportRow[] = rawJson.map((record, index) => {
        // Normalize keys case-insensitively
        const norm: Record<string, any> = {};
        Object.entries(record).forEach(([k, v]) => {
          norm[k.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = v;
        });

        const nameVal =
          norm['membername'] ||
          norm['name'] ||
          norm['fullname'] ||
          norm['member'] ||
          norm['customername'] ||
          '';
        const phoneVal =
          norm['phonenumber'] ||
          norm['phone'] ||
          norm['mobile'] ||
          norm['mobilenumber'] ||
          norm['contact'] ||
          norm['whatsapp'] ||
          '';
        const emailVal = norm['email'] || norm['emailaddress'] || '';
        const planVal =
          norm['membershipplan'] ||
          norm['plan'] ||
          norm['planname'] ||
          norm['package'] ||
          'Monthly Plan';
        const feeVal =
          norm['planfee'] ||
          norm['fee'] ||
          norm['amount'] ||
          norm['price'] ||
          '';
        const joinRaw =
          norm['joiningdate'] ||
          norm['startdate'] ||
          norm['joindate'] ||
          norm['enrolleddate'] ||
          todayIso;
        const expiryRaw =
          norm['expirydate'] ||
          norm['enddate'] ||
          norm['validtill'] ||
          norm['validuntil'] ||
          '';
        const pendingRaw =
          norm['pendingamount'] ||
          norm['pending'] ||
          norm['balance'] ||
          norm['due'] ||
          norm['balancedue'] ||
          0;

        const parsedJoin = parseFlexibleDateToIso(joinRaw);
        const startDateStr = parsedJoin || String(joinRaw || todayIso);

        let expiryDateStr = '';
        if (expiryRaw !== '' && expiryRaw !== undefined && expiryRaw !== null) {
          const parsedExp = parseFlexibleDateToIso(expiryRaw);
          expiryDateStr = parsedExp || String(expiryRaw);
        } else if (parsedJoin) {
          expiryDateStr = addMonthsToIso(
            parsedJoin,
            inferMonthsFromPlan(String(planVal))
          );
        } else {
          expiryDateStr = addMonthsToIso(todayIso, 1);
        }

        const feeNum = parseInt(String(feeVal).replace(/[^0-9]/g, ''), 10);
        const planFeeFormatted =
          !isNaN(feeNum) && feeNum > 0
            ? `₹${feeNum.toLocaleString('en-IN')}`
            : inferFeeFromPlan(String(planVal), plans);

        const pendingNum =
          parseInt(String(pendingRaw).replace(/[^0-9]/g, ''), 10) || 0;

        return {
          rowIndex: index + 1,
          name: String(nameVal).trim(),
          phone: String(phoneVal).trim(),
          email: String(emailVal).trim(),
          membershipPlan: String(planVal).trim() || 'Monthly Plan',
          planFee: planFeeFormatted,
          startDate: startDateStr,
          expiryDate: expiryDateStr,
          pendingAmount: Math.max(0, pendingNum),
          skipRow: false,
          isEditing: false,
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error('Import file parse error:', err);
      setParseError(
        'Could not parse the selected file. Please upload a valid .CSV or .XLSX file.'
      );
      setRows([]);
    }
  };

  const handleUpdateRowField = (
    rowIndex: number,
    updates: Partial<ParsedImportRow>
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.rowIndex === rowIndex ? { ...r, ...updates } : r))
    );
  };

  const handleConfirmImportClick = () => {
    const todayMidnight = new Date(getLocalIso() + 'T00:00:00').getTime();
    const readyRows = evaluatedRows.filter(
      (r) => !r.skipRow && r.status === 'ready' && r.validStart && r.validExpiry
    );

    const payload = readyRows.map((r) => {
      const expIso = r.validExpiry!;
      const expMidnight = new Date(expIso + 'T00:00:00').getTime();
      const daysUntilExpiry = Math.round(
        (expMidnight - todayMidnight) / (1000 * 60 * 60 * 24)
      );
      const formattedExp = new Date(expIso + 'T00:00:00').toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      );

      let status: Member['status'] = 'active';
      if (daysUntilExpiry < 0) status = 'expired';
      else if (r.pendingAmount > 0) status = 'pending';
      else if (daysUntilExpiry <= 7) status = 'expiring';

      return {
        name: r.name.trim(),
        phone: r.clean10,
        email: r.email || undefined,
        membershipPlan: r.membershipPlan,
        planFee: r.planFee,
        startDate: r.validStart!,
        expiryDate: formattedExp,
        daysUntilExpiry,
        pendingAmount: r.pendingAmount,
        lastVisitDate: 'No visits recorded',
        daysSinceLastVisit: 0,
        status,
        visitsThisMonth: 0,
        totalVisits: 0,
      };
    });

    const result = onConfirmImport(payload);
    setImportSummary({
      importedCount: result.importedCount,
      skippedCount: counts.duplicateCount + result.skippedDuplicatesCount,
      attentionSkippedCount: counts.attentionCount,
    });
  };

  const visibleRows = evaluatedRows.filter((r) => {
    if (filterView === 'ready') return !r.skipRow && r.status === 'ready';
    if (filterView === 'attention') return !r.skipRow && r.status === 'attention';
    if (filterView === 'duplicate') return r.skipRow || r.status === 'duplicate';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-[#191919] leading-tight">
                Import Members (Excel / CSV)
              </h3>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                Preview, fix issues, and prevent duplicate records before saving
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close import modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Post-Import Summary Screen */}
        {importSummary ? (
          <div className="py-6 text-center space-y-3 overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h4 className="text-base font-bold text-[#191919]">
              Member Import Complete
            </h4>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto text-center">
              <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#CDEEDB]">
                <span className="text-lg font-bold text-[#15803D] block leading-none">
                  {importSummary.importedCount}
                </span>
                <span className="text-[10px] font-semibold text-[#15803D] mt-1 block">
                  Imported
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                <span className="text-lg font-bold text-[#B45309] block leading-none">
                  {importSummary.skippedCount}
                </span>
                <span className="text-[10px] font-semibold text-[#B45309] mt-1 block">
                  Duplicates Skipped
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                <span className="text-lg font-bold text-[#DC2626] block leading-none">
                  {importSummary.attentionSkippedCount}
                </span>
                <span className="text-[10px] font-semibold text-[#DC2626] mt-1 block">
                  Unresolved Skipped
                </span>
              </div>
            </div>
            <p className="text-xs text-[#52525B] max-w-xs mx-auto leading-relaxed">
              Existing member records were preserved and never overwritten.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setRows([]);
                  setFileName('');
                  setImportSummary(null);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-[#102A71] text-white text-xs font-bold hover:bg-[#0D225D] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-0.5">
            {/* File Picker & Sample Template Bar */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D5CFC2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#191919] truncate">
                  {fileName ? `Selected: ${fileName}` : 'Choose a .CSV or .XLSX file'}
                </p>
                <p className="text-[10.5px] text-[#71717A] mt-0.5">
                  Columns: Name, Phone, Email, Plan, Fee, Joining Date, Expiry Date
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:bg-[#F2EFE8] text-[11px] font-semibold text-[#102A71] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Sample CSV</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#102A71] hover:bg-[#0D225D] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3 h-3" />
                  <span>{fileName ? 'Change File' : 'Select File'}</span>
                </button>
              </div>
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview & Validation Section */}
            {evaluatedRows.length > 0 && (
              <>
                {/* Summary Filter Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterView('all')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      filterView === 'all'
                        ? 'bg-[#102A71] text-white border-[#102A71]'
                        : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC]'
                    }`}
                  >
                    <span className="text-sm font-bold block leading-none">
                      {evaluatedRows.length}
                    </span>
                    <span className="text-[9.5px] font-semibold mt-0.5 block">
                      Total Rows
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('ready')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      filterView === 'ready'
                        ? 'bg-[#15803D] text-white border-[#15803D]'
                        : 'bg-[#ECFDF5] text-[#15803D] border-[#CDEEDB]'
                    }`}
                  >
                    <span className="text-sm font-bold block leading-none">
                      {counts.readyCount}
                    </span>
                    <span className="text-[9.5px] font-semibold mt-0.5 block">
                      Ready
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('attention')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      filterView === 'attention'
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                    }`}
                  >
                    <span className="text-sm font-bold block leading-none">
                      {counts.attentionCount}
                    </span>
                    <span className="text-[9.5px] font-semibold mt-0.5 block">
                      Attention
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView('duplicate')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      filterView === 'duplicate'
                        ? 'bg-[#D97706] text-white border-[#D97706]'
                        : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    }`}
                  >
                    <span className="text-sm font-bold block leading-none">
                      {counts.duplicateCount}
                    </span>
                    <span className="text-[9.5px] font-semibold mt-0.5 block">
                      Skipped
                    </span>
                  </button>
                </div>

                {/* Preview List */}
                <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
                  {visibleRows.map((row) => (
                    <div
                      key={row.rowIndex}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        row.skipRow || row.status === 'duplicate'
                          ? 'bg-[#FAF8F5] border-[#EAE5DC] opacity-75'
                          : row.status === 'attention'
                          ? 'bg-[#FEF2F2] border-[#FECACA]'
                          : 'bg-white border-[#EAE5DC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#71717A] bg-[#F4F1EA] px-1.5 py-0.5 rounded">
                              Row #{row.rowIndex}
                            </span>
                            <span className="font-bold text-[#191919] text-[13px] break-normal">
                              {row.name || '(Missing Name)'}
                            </span>
                            {row.skipRow ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] text-[10px] font-semibold">
                                Skipped by Owner
                              </span>
                            ) : row.status === 'duplicate' ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[10px] font-semibold">
                                {row.isDuplicateExisting
                                  ? 'Duplicate (Already in Gym)'
                                  : 'Duplicate in File'}
                              </span>
                            ) : row.status === 'attention' ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] text-[10px] font-semibold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Needs Correction</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] text-[10px] font-semibold">
                                Ready to Import
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#52525B] mt-1">
                            Phone: <strong>{row.phone || '—'}</strong> · Plan:{' '}
                            <strong>{row.membershipPlan}</strong> ({row.planFee})
                          </p>
                          <p className="text-[10.5px] text-[#71717A] mt-0.5">
                            Join: {row.validStart || row.startDate} → Expiry:{' '}
                            {row.validExpiry || row.expiryDate}
                            {row.pendingAmount > 0
                              ? ` · Due: ₹${row.pendingAmount.toLocaleString('en-IN')}`
                              : ''}
                          </p>

                          {row.issues.length > 0 && !row.skipRow && (
                            <p className="text-[10.5px] font-semibold text-[#DC2626] mt-1">
                              Issues: {row.issues.join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {row.status !== 'duplicate' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateRowField(row.rowIndex, {
                                  isEditing: !row.isEditing,
                                })
                              }
                              className="p-1.5 rounded-lg bg-white border border-[#EAE5DC] text-[#102A71] hover:bg-[#F2EFE8] cursor-pointer"
                              title="Edit row fields"
                            >
                              {row.isEditing ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Edit2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateRowField(row.rowIndex, {
                                skipRow: !row.skipRow,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white border border-[#EAE5DC] text-[#71717A] hover:text-[#DC2626] cursor-pointer"
                            title={row.skipRow ? 'Include row' : 'Skip row'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Editor for Fixing Attention Rows */}
                      {row.isEditing && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#EAE5DC] grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-[#52525B] block mb-0.5">
                              Member Name
                            </label>
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                handleUpdateRowField(row.rowIndex, {
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-[#EAE5DC] text-[11px] font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#52525B] block mb-0.5">
                              10-Digit Phone
                            </label>
                            <input
                              type="tel"
                              value={row.phone}
                              onChange={(e) =>
                                handleUpdateRowField(row.rowIndex, {
                                  phone: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-[#EAE5DC] text-[11px] font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#52525B] block mb-0.5">
                              Joining Date (YYYY-MM-DD)
                            </label>
                            <input
                              type="date"
                              value={row.validStart || ''}
                              onChange={(e) =>
                                handleUpdateRowField(row.rowIndex, {
                                  startDate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-[#EAE5DC] text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#52525B] block mb-0.5">
                              Expiry Date (YYYY-MM-DD)
                            </label>
                            <input
                              type="date"
                              value={row.validExpiry || ''}
                              onChange={(e) =>
                                handleUpdateRowField(row.rowIndex, {
                                  expiryDate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-[#EAE5DC] text-[11px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="pt-2 border-t border-[#F2EFE8] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-bold text-[#52525B] hover:bg-[#F2EFE8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={counts.readyCount === 0}
                onClick={handleConfirmImportClick}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  counts.readyCount > 0
                    ? 'bg-[#102A71] hover:bg-[#0D225D] text-white cursor-pointer shadow-xs'
                    : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Confirm Import ({counts.readyCount} Valid Record
                  {counts.readyCount === 1 ? '' : 's'})
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
