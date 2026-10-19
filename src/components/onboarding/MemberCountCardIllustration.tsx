/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MemberCountCardIllustrationProps {
  tier: 'starting' | '1-50' | '51-100' | '101-250' | '251-500' | '500+';
  className?: string;
}

export const MemberCountCardIllustration: React.FC<MemberCountCardIllustrationProps> = ({
  tier,
  className = 'w-full h-full',
}) => {
  return (
    <div className={`w-full h-full overflow-hidden rounded-xl bg-[#0F172A] relative select-none ${className}`}>
      {/* SVG rendering corresponding to the tier */}
      {tier === 'starting' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="startBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="60%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="warmSun" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="woodFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2D4C0" />
              <stop offset="100%" stopColor="#C9B69C" />
            </linearGradient>
          </defs>
          {/* Wall & Ceiling */}
          <rect width="240" height="74" fill="url(#startBg)" />
          {/* Panoramic Window on Left */}
          <rect x="12" y="10" width="48" height="58" rx="2" fill="#BAE6FD" />
          <rect x="14" y="12" width="44" height="54" rx="1.5" fill="#E0F2FE" />
          <line x1="36" y1="12" x2="36" y2="66" stroke="#475569" strokeWidth="1.5" />
          <line x1="14" y1="38" x2="58" y2="38" stroke="#475569" strokeWidth="1.5" />

          {/* Wooden Floor */}
          <rect x="0" y="72" width="240" height="38" fill="url(#woodFloor)" />
          <line x1="0" y1="72" x2="240" y2="72" stroke="#94A3B8" strokeWidth="1" />

          {/* "GYM" Sign on Back Wall */}
          <rect x="110" y="16" width="42" height="18" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
          <text x="131" y="29.5" textAnchor="middle" fill="#0F172A" fontFamily="sans-serif" fontWeight="900" fontSize="11" letterSpacing="1.5">
            GYM
          </text>

          {/* Potted Indoor Plant on Left */}
          <path d="M 72,74 L 80,74 L 78,86 L 74,86 Z" fill="#334155" />
          <path d="M 76,74 Q 68,54 78,46 Q 84,60 76,74 Z" fill="#15803D" />
          <path d="M 76,74 Q 85,52 82,44 Q 78,62 76,74 Z" fill="#22C55E" />
          <path d="M 76,74 Q 70,58 64,52 Q 72,66 76,74 Z" fill="#16A34A" />

          {/* Potted Plant on Right */}
          <path d="M 194,74 L 202,74 L 200,86 L 196,86 Z" fill="#334155" />
          <path d="M 198,74 Q 190,52 200,44 Q 206,58 198,74 Z" fill="#15803D" />
          <path d="M 198,74 Q 208,50 205,42 Q 199,60 198,74 Z" fill="#22C55E" />

          {/* 1 Person stretching/warming up peacefully */}
          <g transform="translate(102, 52)">
            {/* Exercise Mat */}
            <rect x="0" y="26" width="46" height="5" rx="2" fill="#0284C7" opacity="0.8" />
            {/* Person sitting/kneeling in orange & dark athleticwear */}
            <circle cx="15" cy="10" r="3.2" fill="#FDBA74" />
            <path d="M 15,13 L 13,24 L 22,25 L 20,18 L 17,14 Z" fill="#EA580C" />
            <path d="M 13,24 L 8,26 L 16,27 L 22,25 Z" fill="#1E293B" />
          </g>

          {/* Treadmill / Bench silhouette on far left */}
          <polygon points="4,82 22,78 28,84 6,88" fill="#1E293B" />
          <line x1="8" y1="84" x2="16" y2="68" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="14" y="65" width="8" height="4" rx="1" fill="#334155" />

          {/* Dumbbells on small floor stand on far right */}
          <rect x="216" y="74" width="16" height="12" rx="1.5" fill="#334155" />
          <circle cx="220" cy="72" r="2.5" fill="#0F172A" />
          <circle cx="228" cy="72" r="2.5" fill="#0F172A" />
        </svg>
      )}

      {tier === '1-50' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="floorGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E6D7C3" />
              <stop offset="100%" stopColor="#C4B094" />
            </linearGradient>
          </defs>
          {/* Panoramic Windows & Sunlight */}
          <rect width="240" height="72" fill="#F8FAFC" />
          {/* 3 Large Window Bays */}
          <rect x="15" y="8" width="60" height="60" rx="2" fill="url(#skyGrad1)" />
          <rect x="85" y="8" width="60" height="60" rx="2" fill="url(#skyGrad1)" />
          <rect x="155" y="8" width="60" height="60" rx="2" fill="url(#skyGrad1)" />
          {/* Mullions */}
          <line x1="45" y1="8" x2="45" y2="68" stroke="#334155" strokeWidth="1.5" />
          <line x1="115" y1="8" x2="115" y2="68" stroke="#334155" strokeWidth="1.5" />
          <line x1="185" y1="8" x2="185" y2="68" stroke="#334155" strokeWidth="1.5" />

          {/* Wooden Gym Floor */}
          <rect x="0" y="70" width="240" height="40" fill="url(#floorGrad1)" />

          {/* Indoor Ficus Tree on right */}
          <path d="M 224,72 L 228,72 L 227,84 L 225,84 Z" fill="#334155" />
          <ellipse cx="226" cy="56" rx="9" ry="16" fill="#15803D" />
          <ellipse cx="223" cy="46" rx="7" ry="12" fill="#22C55E" />

          {/* 3 Members working out on cardio machines near windows */}
          {/* Member 1 (Left Treadmill) */}
          <g transform="translate(38, 44)">
            {/* Treadmill */}
            <polygon points="0,32 24,28 30,34 2,38" fill="#1E293B" />
            <line x1="4" y1="34" x2="14" y2="18" stroke="#0F172A" strokeWidth="2" />
            <rect x="12" y="15" width="8" height="4" rx="1" fill="#334155" />
            {/* Person running */}
            <circle cx="16" cy="2" r="3" fill="#FDBA74" />
            <path d="M 16,5 L 14,14 L 18,17 L 16,24" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 15,8 L 11,13 L 7,16" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 14,14 L 10,21 L 6,23" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Member 2 (Center Elliptical) */}
          <g transform="translate(104, 46)">
            {/* Elliptical Frame */}
            <polygon points="0,30 22,26 28,32 2,36" fill="#1E293B" />
            <line x1="18" y1="28" x2="12" y2="14" stroke="#0F172A" strokeWidth="2" />
            <line x1="8" y1="28" x2="14" y2="14" stroke="#0F172A" strokeWidth="2" />
            {/* Person */}
            <circle cx="15" cy="3" r="3" fill="#FDBA74" />
            <path d="M 15,6 L 15,16 L 19,26" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 15,10 L 11,14" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <path d="M 15,8 L 18,13" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Member 3 (Right Treadmill) */}
          <g transform="translate(170, 44)">
            {/* Treadmill */}
            <polygon points="0,32 24,28 30,34 2,38" fill="#1E293B" />
            <line x1="4" y1="34" x2="14" y2="18" stroke="#0F172A" strokeWidth="2" />
            <rect x="12" y="15" width="8" height="4" rx="1" fill="#334155" />
            {/* Person in athleticwear */}
            <circle cx="16" cy="2" r="3" fill="#FDBA74" />
            <path d="M 16,5 L 15,14 L 18,22" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 15,9 L 20,13" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <path d="M 15,14 L 12,22 L 8,24" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {tier === '51-100' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="floorGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DFD0BC" />
              <stop offset="100%" stopColor="#BFA98B" />
            </linearGradient>
          </defs>
          {/* Panoramic Windows */}
          <rect width="240" height="70" fill="#F1F5F9" />
          <rect x="10" y="8" width="68" height="58" rx="2" fill="#BAE6FD" />
          <rect x="86" y="8" width="68" height="58" rx="2" fill="#BAE6FD" />
          <rect x="162" y="8" width="68" height="58" rx="2" fill="#BAE6FD" />
          <line x1="44" y1="8" x2="44" y2="66" stroke="#334155" strokeWidth="1.5" />
          <line x1="120" y1="8" x2="120" y2="66" stroke="#334155" strokeWidth="1.5" />
          <line x1="196" y1="8" x2="196" y2="66" stroke="#334155" strokeWidth="1.5" />

          {/* Wooden Floor */}
          <rect x="0" y="68" width="240" height="42" fill="url(#floorGrad2)" />

          {/* Left Squat Rack Station */}
          <g transform="translate(18, 28)">
            <rect x="0" y="0" width="3" height="48" fill="#0F172A" />
            <rect x="22" y="0" width="3" height="48" fill="#0F172A" />
            <rect x="0" y="0" width="25" height="3" fill="#334155" />
            <line x1="-3" y1="20" x2="28" y2="20" stroke="#94A3B8" strokeWidth="2" />
          </g>

          {/* 4 to 5 Members working out with weights */}
          {/* Member 1: Lifting dumbbell on bench */}
          <g transform="translate(68, 48)">
            <rect x="0" y="24" width="24" height="4" rx="1.5" fill="#0F172A" />
            <circle cx="12" cy="10" r="3" fill="#FDBA74" />
            <path d="M 12,13 L 12,22 L 6,26" stroke="#0F172A" strokeWidth="2.5" />
            <path d="M 12,16 L 18,12 L 18,8" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="7" r="2.5" fill="#0F172A" />
          </g>

          {/* Member 2: Standing with weights */}
          <g transform="translate(112, 42)">
            <circle cx="8" cy="6" r="3" fill="#FDBA74" />
            <path d="M 8,9 L 8,24 L 5,34" stroke="#EA580C" strokeWidth="2.5" />
            <path d="M 8,24 L 11,34" stroke="#0F172A" strokeWidth="2.5" />
            <path d="M 8,13 L 2,18" stroke="#0F172A" strokeWidth="2" />
            <circle cx="1" cy="19" r="2" fill="#334155" />
            <path d="M 8,13 L 14,18" stroke="#0F172A" strokeWidth="2" />
            <circle cx="15" cy="19" r="2" fill="#334155" />
          </g>

          {/* Member 3: Seated cable pull */}
          <g transform="translate(156, 44)">
            <rect x="18" y="10" width="3" height="34" fill="#0F172A" />
            <circle cx="8" cy="12" r="3" fill="#FDBA74" />
            <path d="M 8,15 L 8,26 L 4,32" stroke="#0F172A" strokeWidth="2.5" />
            <path d="M 8,18 L 16,14" stroke="#EA580C" strokeWidth="2" />
          </g>

          {/* Member 4: Stretching */}
          <g transform="translate(198, 48)">
            <circle cx="10" cy="8" r="3" fill="#FDBA74" />
            <path d="M 10,11 L 10,22 L 14,30" stroke="#0284C7" strokeWidth="2.5" />
            <path d="M 10,22 L 6,30" stroke="#0F172A" strokeWidth="2.5" />
            <path d="M 10,14 L 16,11" stroke="#0F172A" strokeWidth="2" />
          </g>
        </svg>
      )}

      {tier === '101-250' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="gymWarmLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="floorGrad3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D8C8B3" />
              <stop offset="100%" stopColor="#B39B7C" />
            </linearGradient>
          </defs>
          {/* Wall with Warm Lighting */}
          <rect width="240" height="66" fill="#F8FAFC" />
          <rect width="240" height="66" fill="url(#gymWarmLight)" />

          {/* Windows on left */}
          <rect x="8" y="8" width="50" height="54" rx="2" fill="#BAE6FD" />
          <line x1="33" y1="8" x2="33" y2="62" stroke="#334155" strokeWidth="1.5" />

          {/* Modern Orange & Black Cage Racks */}
          <rect x="74" y="16" width="3" height="50" fill="#EA580C" />
          <rect x="94" y="16" width="3" height="50" fill="#EA580C" />
          <rect x="72" y="16" width="27" height="3" fill="#1E293B" />

          <rect x="140" y="16" width="3" height="50" fill="#EA580C" />
          <rect x="160" y="16" width="3" height="50" fill="#EA580C" />
          <rect x="138" y="16" width="27" height="3" fill="#1E293B" />

          <rect x="198" y="16" width="3" height="50" fill="#EA580C" />
          <rect x="218" y="16" width="3" height="50" fill="#EA580C" />

          {/* Wooden Floor */}
          <rect x="0" y="66" width="240" height="44" fill="url(#floorGrad3)" />

          {/* 8 to 10 Active Gym Members */}
          {/* Group 1: Left window runners */}
          <circle cx="20" cy="48" r="2.8" fill="#FDBA74" />
          <path d="M 20,51 L 20,62 L 17,70" stroke="#0F172A" strokeWidth="2.2" />

          <circle cx="44" cy="46" r="2.8" fill="#FDBA74" />
          <path d="M 44,49 L 44,60 L 48,68" stroke="#EA580C" strokeWidth="2.2" />

          {/* Group 2: Center orange racks */}
          <circle cx="84" cy="38" r="2.8" fill="#FDBA74" />
          <path d="M 84,41 L 84,54 L 81,62" stroke="#0284C7" strokeWidth="2.2" />
          <path d="M 84,45 L 89,39" stroke="#0F172A" strokeWidth="1.8" />

          <circle cx="108" cy="44" r="2.8" fill="#FDBA74" />
          <path d="M 108,47 L 108,58 L 112,66" stroke="#EA580C" strokeWidth="2.2" />

          <circle cx="132" cy="42" r="2.8" fill="#FDBA74" />
          <path d="M 132,45 L 132,56 L 128,64" stroke="#0F172A" strokeWidth="2.2" />

          {/* Group 3: Right area */}
          <circle cx="152" cy="38" r="2.8" fill="#FDBA74" />
          <path d="M 152,41 L 152,54 L 155,62" stroke="#EA580C" strokeWidth="2.2" />

          <circle cx="178" cy="46" r="2.8" fill="#FDBA74" />
          <path d="M 178,49 L 178,60 L 175,68" stroke="#0284C7" strokeWidth="2.2" />

          <circle cx="208" cy="40" r="2.8" fill="#FDBA74" />
          <path d="M 208,43 L 208,54 L 211,62" stroke="#0F172A" strokeWidth="2.2" />
        </svg>
      )}

      {tier === '251-500' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="floorGrad4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4C2AB" />
              <stop offset="100%" stopColor="#AA9070" />
            </linearGradient>
          </defs>
          {/* Wall & Orange structural accents */}
          <rect width="240" height="64" fill="#F8FAFC" />
          <rect x="8" y="8" width="46" height="52" rx="2" fill="#BAE6FD" />
          <line x1="31" y1="8" x2="31" y2="60" stroke="#334155" strokeWidth="1.5" />

          {/* Continuous Orange & Charcoal Stations */}
          <g fill="#EA580C">
            <rect x="62" y="14" width="2.5" height="50" />
            <rect x="78" y="14" width="2.5" height="50" />
            <rect x="110" y="14" width="2.5" height="50" />
            <rect x="126" y="14" width="2.5" height="50" />
            <rect x="158" y="14" width="2.5" height="50" />
            <rect x="174" y="14" width="2.5" height="50" />
            <rect x="204" y="14" width="2.5" height="50" />
            <rect x="220" y="14" width="2.5" height="50" />
          </g>

          {/* Wooden Floor */}
          <rect x="0" y="64" width="240" height="46" fill="url(#floorGrad4)" />

          {/* Bustling gym with 14+ active athletes */}
          <g>
            {/* Person 1 */}
            <circle cx="16" cy="48" r="2.5" fill="#FDBA74" />
            <path d="M 16,51 L 16,60 L 13,67" stroke="#0F172A" strokeWidth="2" />
            {/* Person 2 */}
            <circle cx="34" cy="46" r="2.5" fill="#FDBA74" />
            <path d="M 34,49 L 34,58 L 37,65" stroke="#EA580C" strokeWidth="2" />
            {/* Person 3 */}
            <circle cx="52" cy="50" r="2.5" fill="#FDBA74" />
            <path d="M 52,53 L 52,62 L 49,69" stroke="#0284C7" strokeWidth="2" />
            {/* Person 4 */}
            <circle cx="70" cy="38" r="2.5" fill="#FDBA74" />
            <path d="M 70,41 L 70,52 L 73,59" stroke="#0F172A" strokeWidth="2" />
            {/* Person 5 */}
            <circle cx="86" cy="44" r="2.5" fill="#FDBA74" />
            <path d="M 86,47 L 86,56 L 83,63" stroke="#EA580C" strokeWidth="2" />
            {/* Person 6 */}
            <circle cx="102" cy="48" r="2.5" fill="#FDBA74" />
            <path d="M 102,51 L 102,60 L 105,67" stroke="#0F172A" strokeWidth="2" />
            {/* Person 7 */}
            <circle cx="118" cy="36" r="2.5" fill="#FDBA74" />
            <path d="M 118,39 L 118,50 L 115,57" stroke="#EA580C" strokeWidth="2" />
            {/* Person 8 */}
            <circle cx="134" cy="44" r="2.5" fill="#FDBA74" />
            <path d="M 134,47 L 134,56 L 137,63" stroke="#0284C7" strokeWidth="2" />
            {/* Person 9 */}
            <circle cx="150" cy="48" r="2.5" fill="#FDBA74" />
            <path d="M 150,51 L 150,60 L 147,67" stroke="#0F172A" strokeWidth="2" />
            {/* Person 10 */}
            <circle cx="166" cy="38" r="2.5" fill="#FDBA74" />
            <path d="M 166,41 L 166,52 L 169,59" stroke="#EA580C" strokeWidth="2" />
            {/* Person 11 */}
            <circle cx="182" cy="46" r="2.5" fill="#FDBA74" />
            <path d="M 182,49 L 182,58 L 179,65" stroke="#0F172A" strokeWidth="2" />
            {/* Person 12 */}
            <circle cx="198" cy="50" r="2.5" fill="#FDBA74" />
            <path d="M 198,53 L 198,62 L 201,69" stroke="#0284C7" strokeWidth="2" />
            {/* Person 13 */}
            <circle cx="212" cy="38" r="2.5" fill="#FDBA74" />
            <path d="M 212,41 L 212,52 L 209,59" stroke="#EA580C" strokeWidth="2" />
            {/* Person 14 */}
            <circle cx="226" cy="44" r="2.5" fill="#FDBA74" />
            <path d="M 226,47 L 226,56 L 229,63" stroke="#0F172A" strokeWidth="2" />
          </g>
        </svg>
      )}

      {tier === '500+' && (
        <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <linearGradient id="highEnergyGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#FB923C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="floorGrad5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDBAA1" />
              <stop offset="100%" stopColor="#9C8262" />
            </linearGradient>
          </defs>
          {/* High-capacity commercial fitness center with glowing amber architectural lights */}
          <rect width="240" height="62" fill="#1E293B" />
          <rect width="240" height="62" fill="url(#highEnergyGlow)" />

          {/* Multi-tier machine silhouettes and orange accents throughout */}
          <g fill="#EA580C" opacity="0.95">
            <rect x="22" y="12" width="2" height="50" />
            <rect x="36" y="12" width="2" height="50" />
            <rect x="58" y="12" width="2" height="50" />
            <rect x="72" y="12" width="2" height="50" />
            <rect x="94" y="12" width="2" height="50" />
            <rect x="108" y="12" width="2" height="50" />
            <rect x="130" y="12" width="2" height="50" />
            <rect x="144" y="12" width="2" height="50" />
            <rect x="166" y="12" width="2" height="50" />
            <rect x="180" y="12" width="2" height="50" />
            <rect x="202" y="12" width="2" height="50" />
            <rect x="216" y="12" width="2" height="50" />
          </g>

          {/* Wooden Commercial Gym Floor */}
          <rect x="0" y="62" width="240" height="48" fill="url(#floorGrad5)" />

          {/* Dense, high-energy crowd of gym members across multiple depth layers */}
          {/* Back layer (smaller, denser) */}
          <g opacity="0.85">
            {Array.from({ length: 12 }).map((_, i) => {
              const cx = 14 + i * 19;
              return (
                <g key={`back-${i}`}>
                  <circle cx={cx} cy="36" r="2" fill="#FDBA74" />
                  <path
                    d={`M ${cx},38 L ${cx},46 L ${cx + (i % 2 === 0 ? 2 : -2)},52`}
                    stroke={i % 3 === 0 ? '#EA580C' : i % 3 === 1 ? '#0F172A' : '#0284C7'}
                    strokeWidth="1.8"
                  />
                </g>
              );
            })}
          </g>

          {/* Mid layer */}
          <g>
            {Array.from({ length: 11 }).map((_, i) => {
              const cx = 20 + i * 20;
              return (
                <g key={`mid-${i}`}>
                  <circle cx={cx} cy="44" r="2.4" fill="#FDBA74" />
                  <path
                    d={`M ${cx},47 L ${cx},56 L ${cx + (i % 2 === 0 ? 3 : -3)},64`}
                    stroke={i % 2 === 0 ? '#EA580C' : '#0F172A'}
                    strokeWidth="2.1"
                  />
                </g>
              );
            })}
          </g>

          {/* Front layer */}
          <g>
            {Array.from({ length: 9 }).map((_, i) => {
              const cx = 26 + i * 24;
              return (
                <g key={`front-${i}`}>
                  <circle cx={cx} cy="52" r="2.8" fill="#FDBA74" />
                  <path
                    d={`M ${cx},55 L ${cx},66 L ${cx + (i % 2 === 0 ? 4 : -4)},74`}
                    stroke={i % 3 === 0 ? '#0F172A' : i % 3 === 1 ? '#EA580C' : '#0284C7'}
                    strokeWidth="2.4"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
};
