/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SplashScreenProps {
  onEnterDashboard?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterDashboard }) => {
  return (
    <main
      onClick={onEnterDashboard}
      className="relative w-full h-[100dvh] overflow-hidden bg-[#F2EFE8] flex flex-col justify-center items-center select-none cursor-pointer"
      role="main"
      aria-label="Gym Business OS Welcome Screen"
    >
      {/* ============================================================== */}
      {/* BACKGROUND ATMOSPHERE: Decorative Curves, Light & Bokeh        */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Soft radial warm glow in center-top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[550px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle at 50% 30%, #FCF9F3 0%, rgba(242, 239, 232, 0) 70%)',
          }}
        />

        {/* Top-Right Decorative Arcs */}
        <svg
          className="absolute -top-12 -right-16 w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] opacity-45"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle cx="280" cy="120" r="160" stroke="#DFCFAF" strokeWidth="1.2" strokeOpacity="0.45" />
          <circle cx="280" cy="120" r="230" stroke="#DFD4B8" strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="280" cy="120" r="310" stroke="#E5DEC9" strokeWidth="0.8" strokeOpacity="0.25" />
        </svg>

        {/* Upper-Left / Mid-Left Soft Curve */}
        <svg
          className="absolute top-[18%] -left-36 w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] opacity-35"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle cx="100" cy="200" r="240" stroke="#DECFA9" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx="100" cy="200" r="320" stroke="#E5D9B8" strokeWidth="0.8" strokeOpacity="0.3" />
        </svg>

        {/* Bottom Swooping Arc */}
        <svg
          className="absolute bottom-[10%] -left-20 w-[480px] h-[320px] opacity-35"
          viewBox="0 0 500 350"
          fill="none"
        >
          <path
            d="M -50,300 C 120,270 230,170 340,90 C 390,55 450,20 520,0"
            stroke="#DFD2B4"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
        </svg>

        {/* Left Side Plant Bokeh (Soft Out-of-Focus Foliage) */}
        <div className="absolute top-[40%] -left-8 w-24 h-48 sm:w-28 sm:h-56 opacity-55 blur-[16px] pointer-events-none transform -rotate-12">
          <div className="w-16 h-28 bg-[#526B47] rounded-full transform rotate-45 mb-1 opacity-70" />
          <div className="w-14 h-24 bg-[#3B5435] rounded-full transform -rotate-12 -mt-10 ml-4 opacity-80" />
          <div className="w-12 h-20 bg-[#657E56] rounded-full transform rotate-30 -mt-8 opacity-60" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN HERO CONTENT: Centered Logo, Typography, and Indicator     */}
      {/* ============================================================== */}
      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center justify-center text-center">
        {/* Subtle mount animation wrapper */}
        <div className="flex flex-col items-center transition-all duration-700 ease-out transform translate-y-0 opacity-100">
          
          {/* Logo Badge (Squircle) */}
          <div
            className="relative w-32 h-32 sm:w-[138px] sm:h-[138px] rounded-[32px] sm:rounded-[36px] flex items-center justify-center transition-transform hover:scale-[1.02] duration-300"
            style={{
              background: 'linear-gradient(145deg, #204CBF 0%, #163690 48%, #0F2566 100%)',
              boxShadow:
                'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.35), 0 20px 38px -10px rgba(15, 37, 102, 0.42), 0 8px 16px -6px rgba(15, 37, 102, 0.28)',
            }}
            aria-hidden="true"
          >
            {/* Subtle inner radial highlight at top-center */}
            <div
              className="absolute inset-0 rounded-[32px] sm:rounded-[36px] pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 65%)',
              }}
            />

            {/* Dumbbell Icon — Precision Dimensional Vector matching reference */}
            <svg
              className="w-20 h-20 sm:w-[88px] sm:h-[88px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="barGrad" x1="28" y1="46" x2="28" y2="54" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#F8FAFC" />
                  <stop offset="85%" stopColor="#DDE3EA" />
                  <stop offset="100%" stopColor="#CCD3DC" />
                </linearGradient>

                <linearGradient id="leftInnerPlate" x1="36" y1="26" x2="42" y2="74" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#F1F4F8" />
                  <stop offset="100%" stopColor="#D3DAE4" />
                </linearGradient>

                <linearGradient id="leftOuterPlate" x1="24" y1="32" x2="30" y2="68" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E9EEF5" />
                  <stop offset="100%" stopColor="#CBD3DD" />
                </linearGradient>

                <linearGradient id="rightInnerPlate" x1="58" y1="26" x2="64" y2="74" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#F1F4F8" />
                  <stop offset="100%" stopColor="#D3DAE4" />
                </linearGradient>

                <linearGradient id="rightOuterPlate" x1="70" y1="32" x2="76" y2="68" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E9EEF5" />
                  <stop offset="100%" stopColor="#CBD3DD" />
                </linearGradient>

                <linearGradient id="collarGrad" x1="0" y1="44" x2="0" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#C4CCD7" />
                </linearGradient>

                <filter id="softPlateShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0A183D" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Central Knurled Grip Bar */}
              <rect x="32" y="46" width="36" height="8" rx="4" fill="url(#barGrad)" />

              {/* Bar Collar Rings */}
              <rect x="42.5" y="44.5" width="2.5" height="11" rx="1.2" fill="url(#collarGrad)" />
              <rect x="55" y="44.5" width="2.5" height="11" rx="1.2" fill="url(#collarGrad)" />

              {/* LEFT Plate Assembly */}
              <rect
                x="25"
                y="34"
                width="8.5"
                height="32"
                rx="4.25"
                fill="url(#leftOuterPlate)"
                filter="url(#softPlateShadow)"
              />
              <rect
                x="35"
                y="26"
                width="9"
                height="48"
                rx="4.5"
                fill="url(#leftInnerPlate)"
                filter="url(#softPlateShadow)"
              />

              {/* RIGHT Plate Assembly */}
              <rect
                x="56"
                y="26"
                width="9"
                height="48"
                rx="4.5"
                fill="url(#rightInnerPlate)"
                filter="url(#softPlateShadow)"
              />
              <rect
                x="66.5"
                y="34"
                width="8.5"
                height="32"
                rx="4.25"
                fill="url(#rightOuterPlate)"
                filter="url(#softPlateShadow)"
              />
            </svg>
          </div>

          {/* Typography Title: "Gym Business OS" */}
          <h1 className="mt-7 sm:mt-8 tracking-[-0.025em] flex items-baseline justify-center">
            <span
              className="font-serif-brand font-bold text-[34px] sm:text-[38px] leading-tight text-[#142C6F]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Gym
            </span>
            <span
              className="font-serif-brand font-bold text-[34px] sm:text-[38px] leading-tight text-[#111216] ml-2.5"
              style={{ letterSpacing: '-0.02em' }}
            >
              Business OS
            </span>
          </h1>

          {/* Tagline: "Run your gym smarter." */}
          <p className="mt-2.5 text-[#676B73] text-[15px] sm:text-[16px] font-normal tracking-[-0.01em]">
            Run your gym smarter.
          </p>

          {/* Three-Dot Loading Indicator (Glow Pulse Wave) */}
          <div
            className="mt-7 sm:mt-8 flex items-center justify-center gap-2.5 h-4 cursor-pointer"
            onClick={onEnterDashboard}
            role="status"
            aria-label="Loading Gym Business OS"
            title="Click to enter Dashboard"
          >
            <span className="w-[7px] h-[7px] rounded-full bg-[#153378] animate-dot-1 transition-transform" />
            <span className="w-[7px] h-[7px] rounded-full bg-[#D6CBB9] animate-dot-2 transition-transform" />
            <span className="w-[7px] h-[7px] rounded-full bg-[#E6DECf] animate-dot-3 transition-transform" />
            <span className="sr-only">Loading Gym Business OS...</span>
          </div>

        </div>
      </div>
    </main>
  );
};
