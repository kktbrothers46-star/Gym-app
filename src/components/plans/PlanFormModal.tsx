/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Calendar, IndianRupee, Tag, AlertCircle } from 'lucide-react';
import { MembershipPlan } from '../../types/dashboard';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: MembershipPlan | null;
  onSavePlan: (
    planData: Omit<MembershipPlan, 'id' | 'code' | 'createdAt'>,
    editingPlanId?: string
  ) => void;
}

const DEFAULT_BENEFITS = [
  'Full Gym & Cardio Access',
  'Locker Facility',
  '1 Initial Fitness Assessment',
  'Zero Joining Fee',
  'Custom Workout Split',
  'Diet & Macro Consultation',
  '15-Day Membership Freeze',
  'Personal Trainer Sessions',
];

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  initialPlan,
  onSavePlan,
}) => {
  const [name, setName] = useState('');
  const [durationPreset, setDurationPreset] = useState<'1m' | '3m' | '6m' | '12m' | 'custom'>('1m');
  const [durationValue, setDurationValue] = useState<string>('1');
  const [durationUnit, setDurationUnit] = useState<'days' | 'months'>('months');
  const [price, setPrice] = useState<string>('2000');
  const [registrationFee, setRegistrationFee] = useState<string>('0');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [category, setCategory] = useState<'General' | 'Personal Training' | 'Special' | 'Custom'>('General');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Full Gym & Cardio Access',
    'Locker Facility',
  ]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlan) {
      setName(initialPlan.name);
      setDurationValue(String(initialPlan.durationValue));
      setDurationUnit(initialPlan.durationUnit);
      setPrice(String(initialPlan.price));
      setRegistrationFee(String(initialPlan.registrationFee || 0));
      setStatus(initialPlan.status);
      setCategory(initialPlan.category || (initialPlan.isCustom ? 'Custom' : 'General'));
      setDescription(initialPlan.description);
      setSelectedFeatures(initialPlan.features || []);

      if (!initialPlan.isCustom && initialPlan.durationUnit === 'months') {
        if (initialPlan.durationValue === 1) setDurationPreset('1m');
        else if (initialPlan.durationValue === 3) setDurationPreset('3m');
        else if (initialPlan.durationValue === 6) setDurationPreset('6m');
        else if (initialPlan.durationValue === 12) setDurationPreset('12m');
        else setDurationPreset('custom');
      } else {
        setDurationPreset('custom');
      }
    } else {
      setName('');
      setDurationPreset('1m');
      setDurationValue('1');
      setDurationUnit('months');
      setPrice('2000');
      setRegistrationFee('0');
      setStatus('active');
      setCategory('General');
      setDescription('Full gym floor access including strength and cardio zones.');
      setSelectedFeatures(['Full Gym & Cardio Access', 'Locker Facility']);
    }
    setErrorMsg(null);
  }, [initialPlan, isOpen]);

  if (!isOpen) return null;

  const handlePresetClick = (preset: '1m' | '3m' | '6m' | '12m' | 'custom') => {
    setDurationPreset(preset);
    if (preset === '1m') {
      setDurationValue('1');
      setDurationUnit('months');
      if (!initialPlan && !name) setName('Monthly Plan');
    } else if (preset === '3m') {
      setDurationValue('3');
      setDurationUnit('months');
      if (!initialPlan && (!name || name === 'Monthly Plan')) setName('3 Months Plan');
    } else if (preset === '6m') {
      setDurationValue('6');
      setDurationUnit('months');
      if (!initialPlan && (!name || name.includes('Plan'))) setName('6 Months Plan');
    } else if (preset === '12m') {
      setDurationValue('12');
      setDurationUnit('months');
      if (!initialPlan && (!name || name.includes('Plan'))) setName('Annual Plan');
    } else {
      setDurationValue('45');
      setDurationUnit('days');
      setCategory('Custom');
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleAddCustomFeature = () => {
    const trimmed = customFeatureInput.trim();
    if (!trimmed) return;
    if (!selectedFeatures.includes(trimmed)) {
      setSelectedFeatures((prev) => [...prev, trimmed]);
    }
    setCustomFeatureInput('');
  };

  const parsedDurationVal = Math.max(1, parseInt(durationValue, 10) || 1);
  const computedDays =
    durationUnit === 'months' ? parsedDurationVal * 30 : parsedDurationVal;
  const parsedPrice = Math.max(0, parseFloat(price) || 0);
  const effectiveMonthly =
    computedDays > 0 ? Math.round((parsedPrice / computedDays) * 30) : parsedPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a membership plan name.');
      return;
    }
    if (parsedPrice <= 0) {
      setErrorMsg('Plan fee must be greater than ₹0.');
      return;
    }
    if (parsedDurationVal <= 0) {
      setErrorMsg('Please enter a valid plan duration.');
      return;
    }

    const isCustomPlan =
      durationPreset === 'custom' ||
      durationUnit === 'days' ||
      ![1, 3, 6, 12].includes(parsedDurationVal);

    const durationLabel =
      durationUnit === 'months'
        ? `${parsedDurationVal} ${parsedDurationVal === 1 ? 'Month' : 'Months'} (${computedDays} Days)`
        : `${parsedDurationVal} Days Custom`;

    onSavePlan(
      {
        name: name.trim(),
        durationValue: parsedDurationVal,
        durationUnit,
        durationDays: computedDays,
        durationLabel,
        price: parsedPrice,
        registrationFee: Math.max(0, parseFloat(registrationFee) || 0),
        status,
        isCustom: isCustomPlan,
        description:
          description.trim() ||
          `Includes ${durationLabel} validity with gym floor and equipment access.`,
        features:
          selectedFeatures.length > 0
            ? selectedFeatures
            : ['Full Gym & Cardio Access'],
        category,
      },
      initialPlan?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#EAE5DC] relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F2EFE8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#102A71] text-white flex items-center justify-center shadow-2xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919] leading-tight">
                {initialPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
              </h3>
              <p className="text-[11px] text-[#71717A] mt-0.5 leading-none">
                {initialPlan
                  ? `Updating ${initialPlan.code} • ${initialPlan.name}`
                  : 'Configure pricing, duration & member perks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F4F1EA] hover:bg-[#EAE5DC] flex items-center justify-center text-[#71717A] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-[#FEECEB] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {/* Plan Name */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 3 Months Strength & Cardio"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
            />
          </div>

          {/* Smart Duration Presets */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              Plan Validity Duration *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: '1m', label: '1 Mo' },
                { id: '3m', label: '3 Mos' },
                { id: '6m', label: '6 Mos' },
                { id: '12m', label: '1 Year' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePresetClick(p.id as any)}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    durationPreset === p.id
                      ? 'bg-[#102A71] text-white border-[#102A71] shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#191919] border-[#EAE5DC] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Duration Input Row */}
            {durationPreset === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                    Duration Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-[#E5E0D6] rounded-lg focus:outline-hidden focus:border-[#102A71]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#71717A] mb-0.5">
                    Unit
                  </label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as 'days' | 'months')}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-[#E5E0D6] rounded-lg focus:outline-hidden focus:border-[#102A71]"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Row: Plan Fee & Joining Fee */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#191919] mb-1">
                Plan Price (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717A]">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2000"
                  className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm font-bold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#191919] mb-1">
                Joining Fee (₹ Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#71717A]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71]"
                />
              </div>
            </div>
          </div>

          {/* Live Value Breakdown */}
          <div className="px-2.5 py-1.5 rounded-xl bg-[#EBF1FE] border border-[#DCE6FC] flex items-center justify-between text-[11.5px]">
            <div className="flex items-center gap-1.5 text-[#1E3A8A] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Validity: {computedDays} Days</span>
            </div>
            <div className="font-bold text-[#102A71]">
              ≈ ₹{effectiveMonthly.toLocaleString('en-IN')} / month
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              Short Plan Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe who this package is ideal for and key inclusions..."
              className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-xl text-[#191919] focus:outline-hidden focus:border-[#102A71] resize-none"
            />
          </div>

          {/* Included Features / Perks */}
          <div>
            <label className="block text-[11px] font-bold text-[#191919] mb-1">
              Included Benefits ({selectedFeatures.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
              {Array.from(new Set([...DEFAULT_BENEFITS, ...selectedFeatures])).map(
                (feat) => {
                  const isSelected = selectedFeatures.includes(feat);
                  return (
                    <button
                      type="button"
                      key={feat}
                      onClick={() => toggleFeature(feat)}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EAF7EE] text-[#15803D] border-[#BBF7D0]'
                          : 'bg-[#FAF8F5] text-[#71717A] border-[#EAE5DC] hover:text-[#191919]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                      <span>{feat}</span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Add Custom Benefit Input */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                type="text"
                value={customFeatureInput}
                onChange={(e) => setCustomFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
                placeholder="Add custom perk (e.g. Steam Bath, Zumba)..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D6] rounded-lg focus:outline-hidden focus:border-[#102A71]"
              />
              <button
                type="button"
                onClick={handleAddCustomFeature}
                className="px-2.5 py-1.5 rounded-lg bg-[#F4F1EA] hover:bg-[#EAE5DC] text-[11px] font-bold text-[#102A71] cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Plan Status Toggle */}
          <div className="pt-0.5 flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
            <div>
              <div className="text-xs font-bold text-[#191919]">
                Plan Status: {status === 'active' ? 'Active' : 'Inactive'}
              </div>
              <div className="text-[10px] text-[#71717A]">
                {status === 'active'
                  ? 'Visible for new member sign-ups & renewals'
                  : 'Archived from new sign-ups (existing members unaffected)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                status === 'active'
                  ? 'bg-[#E8FAF0] text-[#16A34A] border border-[#BBF7D0]'
                  : 'bg-[#F1F3F6] text-[#4B5563] border border-[#D1D5DB]'
              }`}
            >
              {status === 'active' ? '● Active' : '○ Inactive'}
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="pt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:bg-[#F2EFE8] text-xs font-bold text-[#4B5563] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-[#102A71] hover:bg-[#0D225D] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialPlan ? 'Save Plan Changes' : 'Create Membership Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
