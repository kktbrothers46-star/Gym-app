/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const GymBuildingIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 460 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[420px] drop-shadow-xs"
        aria-label="Modern Gym Storefront 3D Illustration"
      >
        <defs>
          {/* Background Soft Sky Blue Cloud Glow */}
          <radialGradient id="skyCloudGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#E3EEF8" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#ECF4FB" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Warm Amber Interior Glow */}
          <radialGradient id="gymInteriorGlow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#FDE68A" stopOpacity="0.92" />
            <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
          </radialGradient>

          {/* Exterior Neon Amber Canopy Strip Light */}
          <linearGradient id="neonCanopyGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="15%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FCD34D" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Dark Charcoal Wall Shading */}
          <linearGradient id="charcoalMain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D333B" />
            <stop offset="50%" stopColor="#22272E" />
            <stop offset="100%" stopColor="#181B20" />
          </linearGradient>

          <linearGradient id="charcoalSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1F242B" />
            <stop offset="100%" stopColor="#13161A" />
          </linearGradient>

          {/* Sign Tower Facade */}
          <linearGradient id="signTowerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E343E" />
            <stop offset="100%" stopColor="#1A1E24" />
          </linearGradient>

          {/* Orange 3D Dumbbell Gradient */}
          <linearGradient id="orangeDumbbellGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* Concrete Steps Gradient */}
          <linearGradient id="concreteTop" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="concreteFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Glass Diagonal Sheen */}
          <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Wall Sconce Amber Light Cone */}
          <linearGradient id="sconceLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>

          {/* Sconce Light Up */}
          <linearGradient id="sconceLightUp" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>

          {/* Soft Ground Shadow Filter */}
          <filter id="groundShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" />
          </filter>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* 1. SOFT SKY-BLUE CLOUD BACKDROP */}
        <path
          d="M 65,200 C 45,155 75,90 135,78 C 170,42 270,30 320,68 C 375,60 415,108 400,165 C 420,205 395,248 350,258 C 300,268 115,268 75,240 C 60,228 60,212 65,200 Z"
          fill="url(#skyCloudGlow)"
        />

        {/* 2. GROUND CONTACT SHADOWS */}
        <ellipse
          cx="235"
          cy="282"
          rx="185"
          ry="18"
          fill="#0F172A"
          fillOpacity="0.14"
          filter="url(#groundShadowBlur)"
        />
        <ellipse
          cx="240"
          cy="276"
          rx="145"
          ry="10"
          fill="#0F172A"
          fillOpacity="0.18"
          filter="url(#groundShadowBlur)"
        />

        {/* 3. TREES ON THE FAR LEFT (Beside Left Facade) */}
        {/* Tree 1 (Back left) */}
        <g opacity="0.95">
          <path d="M 46,235 L 49,150 L 52,235 Z" fill="#4B382A" />
          {/* Foliage layers */}
          <ellipse cx="50" cy="148" rx="14" ry="18" fill="#15803D" />
          <ellipse cx="46" cy="136" rx="12" ry="16" fill="#16A34A" />
          <ellipse cx="52" cy="125" rx="9" ry="12" fill="#22C55E" />
          <ellipse cx="48" cy="120" rx="6" ry="8" fill="#4ADE80" opacity="0.6" />
        </g>

        {/* Tree 2 (Front left) */}
        <g>
          <path d="M 64,248 L 68,162 L 72,248 Z" fill="#3D2B1F" />
          {/* Foliage layers */}
          <ellipse cx="68" cy="170" rx="17" ry="22" fill="#14532D" />
          <ellipse cx="64" cy="154" rx="16" ry="20" fill="#15803D" />
          <ellipse cx="71" cy="140" rx="13" ry="16" fill="#16A34A" />
          <ellipse cx="67" cy="128" rx="10" ry="13" fill="#22C55E" />
          <ellipse cx="64" cy="122" rx="6" ry="8" fill="#86EFAC" opacity="0.7" />
        </g>

        {/* 4. LEFT ANGLED CHARCOAL FACADE WALL */}
        {/* Wall Polygon */}
        <path
          d="M 76,242 L 76,140 L 148,110 L 148,248 Z"
          fill="url(#charcoalSide)"
          stroke="#111418"
          strokeWidth="1.2"
        />

        {/* Vertical Motivational Typography on Left Wall */}
        <g
          transform="translate(88, 142) skewY(-16) scale(0.92, 0.95)"
          fill="#E2E8F0"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="9"
          letterSpacing="1.8"
          opacity="0.9"
        >
          <text x="0" y="0">FITNESS</text>
          <text x="0" y="14">STRENGTH</text>
          <text x="0" y="28">DISCIPLINE</text>
          <text x="0" y="42">PROGRESS</text>
          <text x="0" y="56">COMMUNITY</text>
          {/* Orange Accent Line */}
          <rect x="0" y="63" width="54" height="2.2" rx="1.1" fill="#F97316" />
        </g>

        {/* Wall Sconce Fixture and Amber Light Cones */}
        {/* Light beam down */}
        <polygon
          points="136,155 124,215 146,215"
          fill="url(#sconceLight)"
        />
        {/* Light beam up */}
        <polygon
          points="136,152 126,115 145,115"
          fill="url(#sconceLightUp)"
        />
        {/* Sconce Hardware */}
        <rect x="133" y="149" width="6" height="8" rx="1.5" fill="#0F172A" stroke="#F59E0B" strokeWidth="0.8" />
        <circle cx="136" cy="153" r="2" fill="#FDE68A" />

        {/* 5. MAIN BUILDING STRUCTURE */}
        {/* Main Front Building Mass */}
        <path
          d="M 148,110 L 402,110 L 402,256 L 148,256 Z"
          fill="url(#charcoalMain)"
        />

        {/* 6. GLOWING LUXURY GYM INTERIOR & PANORAMIC GLASS WINDOWS */}
        {/* Interior Warm Glowing Room */}
        <rect
          x="154"
          y="152"
          width="242"
          height="98"
          fill="url(#gymInteriorGlow)"
        />

        {/* Interior Ceiling Light Sconces / Downlights */}
        <g fill="#FFFFFF" opacity="0.95">
          <circle cx="180" cy="162" r="3" />
          <circle cx="218" cy="162" r="3" />
          <circle cx="256" cy="162" r="3.2" />
          <circle cx="294" cy="162" r="3.2" />
          <circle cx="332" cy="162" r="3" />
          <circle cx="370" cy="162" r="3" />
        </g>

        {/* INTERIOR WORKOUT EQUIPMENT SILHOUETTES */}
        {/* Left Interior Bay: Power Rack & Barbell */}
        <g opacity="0.92">
          {/* Power Rack Uprights */}
          <rect x="168" y="172" width="4.5" height="72" rx="1" fill="#181B20" />
          <rect x="194" y="172" width="4.5" height="72" rx="1" fill="#181B20" />
          {/* Top Crossbar */}
          <rect x="165" y="172" width="36" height="4" rx="1" fill="#2D333B" />
          {/* Barbell on J-Hooks */}
          <rect x="158" y="196" width="50" height="3" rx="1" fill="#94A3B8" />
          {/* Weight Plates on Barbell */}
          <rect x="164" y="188" width="3.5" height="19" rx="1.5" fill="#0F172A" />
          <rect x="199" y="188" width="3.5" height="19" rx="1.5" fill="#0F172A" />
          {/* Incline Bench inside rack */}
          <polygon points="174,236 188,212 192,214 178,238" fill="#1E293B" />
          <rect x="172" y="238" width="18" height="4" rx="1" fill="#0F172A" />
        </g>

        {/* Middle-Left Interior Bay: Cable Pulley Station */}
        <g opacity="0.9">
          <rect x="220" y="174" width="3.5" height="70" rx="1" fill="#181B20" />
          <rect x="238" y="174" width="3.5" height="70" rx="1" fill="#181B20" />
          <rect x="218" y="174" width="26" height="4" rx="1" fill="#2D333B" />
          {/* Weight Stack */}
          <rect x="225" y="198" width="12" height="38" rx="1" fill="#0F172A" />
          <line x1="225" y1="204" x2="237" y2="204" stroke="#475569" strokeWidth="0.8" />
          <line x1="225" y1="210" x2="237" y2="210" stroke="#475569" strokeWidth="0.8" />
          <line x1="225" y1="216" x2="237" y2="216" stroke="#475569" strokeWidth="0.8" />
          <line x1="225" y1="222" x2="237" y2="222" stroke="#475569" strokeWidth="0.8" />
          {/* High Pulley Triangle Bar */}
          <path d="M 231,178 L 227,190 L 235,190 Z" fill="none" stroke="#64748B" strokeWidth="1.2" />
        </g>

        {/* Middle-Right Interior Bay: Dumbbell Rack & Mirror Wall */}
        <g opacity="0.92">
          {/* Dumbbell 3-Tier Rack */}
          <rect x="298" y="202" width="32" height="3" rx="1" fill="#475569" />
          <rect x="299" y="215" width="32" height="3" rx="1" fill="#475569" />
          <rect x="300" y="228" width="32" height="3" rx="1" fill="#475569" />
          {/* Rack Legs */}
          <line x1="300" y1="202" x2="297" y2="242" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="328" y1="202" x2="331" y2="242" stroke="#1E293B" strokeWidth="2.5" />
          {/* Dumbbell pairs */}
          <circle cx="304" cy="200" r="2.8" fill="#0F172A" />
          <circle cx="312" cy="200" r="2.8" fill="#0F172A" />
          <circle cx="320" cy="200" r="3" fill="#0F172A" />
          <circle cx="326" cy="200" r="3" fill="#0F172A" />
          <circle cx="305" cy="213" r="3.2" fill="#0F172A" />
          <circle cx="314" cy="213" r="3.2" fill="#0F172A" />
          <circle cx="323" cy="213" r="3.5" fill="#0F172A" />
          <circle cx="306" cy="226" r="3.8" fill="#0F172A" />
          <circle cx="316" cy="226" r="3.8" fill="#0F172A" />
          <circle cx="325" cy="226" r="4.2" fill="#0F172A" />
        </g>

        {/* Right Interior Bay: Treadmill / Cardio Machine */}
        <g opacity="0.9">
          <polygon points="352,240 376,234 384,242 358,248" fill="#1E293B" />
          <line x1="358" y1="240" x2="354" y2="216" stroke="#0F172A" strokeWidth="3" />
          <rect x="350" y="212" width="14" height="6" rx="1.5" fill="#334155" />
          <line x1="351" y1="216" x2="368" y2="222" stroke="#475569" strokeWidth="2" />
        </g>

        {/* GLASS WINDOW FRAMES AND MULLIONS */}
        {/* Outer Window Box Surround */}
        <rect
          x="154"
          y="150"
          width="242"
          height="100"
          fill="none"
          stroke="#111418"
          strokeWidth="3.5"
        />

        {/* Vertical Mullions Dividing Windows */}
        <line x1="205" y1="150" x2="205" y2="250" stroke="#111418" strokeWidth="3.2" />
        <line x1="256" y1="150" x2="256" y2="250" stroke="#111418" strokeWidth="4" />
        <line x1="294" y1="150" x2="294" y2="250" stroke="#111418" strokeWidth="4" />
        <line x1="345" y1="150" x2="345" y2="250" stroke="#111418" strokeWidth="3.2" />

        {/* Central Entrance Double Door Seam & Handles */}
        <line x1="275" y1="150" x2="275" y2="250" stroke="#181B20" strokeWidth="2" />
        {/* Vertical Door Pull Handles */}
        <rect x="272" y="196" width="1.6" height="24" rx="0.8" fill="#E2E8F0" />
        <rect x="276.4" y="196" width="1.6" height="24" rx="0.8" fill="#E2E8F0" />

        {/* Horizontal Window Transom Mullions */}
        <line x1="154" y1="168" x2="396" y2="168" stroke="#111418" strokeWidth="2.2" />

        {/* Realistic Glass Diagonal Reflection Highlights */}
        <polygon
          points="156,152 230,152 170,248 156,248"
          fill="url(#glassSheen)"
          opacity="0.85"
        />
        <polygon
          points="250,152 320,152 245,248 225,248"
          fill="url(#glassSheen)"
          opacity="0.75"
        />
        <polygon
          points="335,152 394,152 325,248 305,248"
          fill="url(#glassSheen)"
          opacity="0.8"
        />

        {/* 7. ROOF CANTILEVERED CANOPY OVERHANG */}
        {/* Overhang Slab */}
        <path
          d="M 142,148 L 410,148 L 406,140 L 146,140 Z"
          fill="#181C22"
          stroke="#0F1216"
          strokeWidth="1.2"
        />
        {/* Canopy Top Edge Highlight */}
        <line x1="146" y1="140" x2="406" y2="140" stroke="#374151" strokeWidth="1" />

        {/* GLOWING AMBER/ORANGE LED ARCHITECTURAL STRIP LIGHT */}
        {/* Intense Neon Line */}
        <rect
          x="144"
          y="146.5"
          width="264"
          height="3"
          rx="1"
          fill="url(#neonCanopyGlow)"
          filter="url(#softGlow)"
        />
        <rect
          x="144"
          y="147"
          width="264"
          height="2"
          rx="1"
          fill="#FEF08A"
        />

        {/* Warm Light Spill down the facade */}
        <rect
          x="148"
          y="149"
          width="254"
          height="6"
          fill="#F59E0B"
          fillOpacity="0.35"
        />

        {/* 8. ELEVATED "GYM" SIGN TOWER */}
        {/* Sign Tower Structure */}
        <path
          d="M 230,80 L 320,80 L 320,142 L 230,142 Z"
          fill="url(#signTowerGrad)"
          stroke="#111418"
          strokeWidth="1.5"
        />
        {/* Sign Tower 3D Bevel Top */}
        <polygon points="230,80 236,73 326,73 320,80" fill="#3A424D" />
        <polygon points="320,80 326,73 326,135 320,142" fill="#1C2128" />

        {/* Orange Accent Bar at Base of Sign Tower */}
        <rect x="230" y="138" width="90" height="3" fill="#EA580C" />

        {/* 3D ORANGE DUMBBELL LOGO */}
        <g id="dumbbellSign">
          {/* Chrome Barbell Bar */}
          <rect x="250" y="94.5" width="50" height="3" rx="1.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.5" />

          {/* Left Weight Plates */}
          {/* Outer plate */}
          <rect x="246" y="87" width="5.5" height="18" rx="2" fill="url(#orangeDumbbellGrad)" />
          <rect x="247" y="88" width="1.5" height="16" rx="0.75" fill="#FED7AA" opacity="0.6" />
          {/* Inner plate */}
          <rect x="253" y="89" width="4.5" height="14" rx="1.5" fill="url(#orangeDumbbellGrad)" />

          {/* Right Weight Plates */}
          {/* Inner plate */}
          <rect x="292" y="89" width="4.5" height="14" rx="1.5" fill="url(#orangeDumbbellGrad)" />
          {/* Outer plate */}
          <rect x="298" y="87" width="5.5" height="18" rx="2" fill="url(#orangeDumbbellGrad)" />
          <rect x="299" y="88" width="1.5" height="16" rx="0.75" fill="#FED7AA" opacity="0.6" />
        </g>

        {/* 3D "GYM" BOLD WHITE TYPOGRAPHY */}
        <text
          x="275"
          y="126"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="24"
          letterSpacing="2.5"
          style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.65))' }}
        >
          GYM
        </text>

        {/* 9. ENTRANCE STAIRS / LOW CONCRETE STEPS */}
        {/* Step 1 (Top Step) */}
        <polygon
          points="232,250 318,250 324,257 226,257"
          fill="url(#concreteTop)"
        />
        <rect
          x="226"
          y="257"
          width="98"
          height="6.5"
          fill="url(#concreteFront)"
        />

        {/* Step 2 (Bottom Step) */}
        <polygon
          points="218,263.5 332,263.5 338,271 212,271"
          fill="url(#concreteTop)"
        />
        <rect
          x="212"
          y="271"
          width="126"
          height="7"
          fill="url(#concreteFront)"
        />

        {/* Cast shadow under bottom step */}
        <polygon
          points="212,278 338,278 344,281 206,281"
          fill="#0F172A"
          fillOpacity="0.3"
        />

        {/* 10. PLANTER BOXES AND LUSH TROPICAL PLANTS */}
        {/* LEFT PLANTER BOX */}
        <g id="leftPlanter">
          {/* Planter Body */}
          <path
            d="M 152,246 L 210,246 L 208,274 L 152,274 Z"
            fill="#1E232A"
            stroke="#12161B"
            strokeWidth="1.2"
          />
          {/* Top Edge */}
          <rect x="150" y="244" width="62" height="3" rx="1" fill="#333942" />

          {/* Exterior Spotlight Fixture on Planter */}
          <circle cx="180" cy="260" r="3" fill="#D97706" stroke="#111418" strokeWidth="0.8" />
          <circle cx="180" cy="260" r="1.5" fill="#FEF08A" />
          {/* Uplight glow */}
          <polygon
            points="180,259 170,244 190,244"
            fill="url(#sconceLightUp)"
            opacity="0.85"
          />

          {/* Tropical Plants & Broad Green Leaves in Left Planter */}
          {/* Back darker leaves */}
          <path d="M 160,244 Q 155,220 168,212 Q 174,228 168,244 Z" fill="#14532D" />
          <path d="M 175,244 Q 170,210 184,204 Q 192,222 182,244 Z" fill="#15803D" />
          <path d="M 195,244 Q 190,218 202,214 Q 206,230 198,244 Z" fill="#14532D" />

          {/* Mid vibrant green leaves */}
          <path d="M 165,244 Q 158,225 174,216 Q 178,232 170,244 Z" fill="#16A34A" />
          <path d="M 180,244 Q 176,215 192,208 Q 196,226 186,244 Z" fill="#22C55E" />
          <path d="M 190,244 Q 186,222 204,218 Q 206,234 196,244 Z" fill="#16A34A" />

          {/* Front highlighted leaves */}
          <path d="M 172,244 Q 168,228 182,222 Q 184,236 178,244 Z" fill="#4ADE80" opacity="0.9" />
          <path d="M 184,244 Q 182,226 195,220 Q 196,234 188,244 Z" fill="#86EFAC" opacity="0.75" />
        </g>

        {/* RIGHT PLANTER BOX */}
        <g id="rightPlanter">
          {/* Planter Body */}
          <path
            d="M 340,246 L 398,246 L 398,274 L 342,274 Z"
            fill="#1E232A"
            stroke="#12161B"
            strokeWidth="1.2"
          />
          {/* Top Edge */}
          <rect x="338" y="244" width="62" height="3" rx="1" fill="#333942" />

          {/* Exterior Spotlight Fixture on Planter */}
          <circle cx="368" cy="260" r="3" fill="#D97706" stroke="#111418" strokeWidth="0.8" />
          <circle cx="368" cy="260" r="1.5" fill="#FEF08A" />
          {/* Uplight glow */}
          <polygon
            points="368,259 358,244 378,244"
            fill="url(#sconceLightUp)"
            opacity="0.85"
          />

          {/* Tropical Plants & Broad Green Leaves in Right Planter */}
          {/* Back darker leaves */}
          <path d="M 350,244 Q 345,220 358,212 Q 364,228 358,244 Z" fill="#14532D" />
          <path d="M 365,244 Q 360,210 374,204 Q 382,222 372,244 Z" fill="#15803D" />
          <path d="M 385,244 Q 380,218 392,214 Q 396,230 388,244 Z" fill="#14532D" />

          {/* Mid vibrant green leaves */}
          <path d="M 355,244 Q 348,225 364,216 Q 368,232 360,244 Z" fill="#16A34A" />
          <path d="M 370,244 Q 366,215 382,208 Q 386,226 376,244 Z" fill="#22C55E" />
          <path d="M 380,244 Q 376,222 394,218 Q 396,234 386,244 Z" fill="#16A34A" />

          {/* Front highlighted leaves */}
          <path d="M 362,244 Q 358,228 372,222 Q 374,236 368,244 Z" fill="#4ADE80" opacity="0.9" />
          <path d="M 374,244 Q 372,226 385,220 Q 386,234 378,244 Z" fill="#86EFAC" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
};
