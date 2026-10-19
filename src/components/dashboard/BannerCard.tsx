/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

const BANNER_SLIDES = [
  {
    kicker: 'KEEP BUILDING',
    title: 'A Healthier Community',
    subtitle: 'More members. More progress. A stronger gym.',
  },
  {
    kicker: 'REVENUE RECOVERY',
    title: 'Recover Outstanding Dues',
    subtitle: 'Send 1-tap WhatsApp payment reminders to overdue members.',
  },
  {
    kicker: 'RETENTION RADAR',
    title: 'Retain Inactive Members',
    subtitle: 'Identify drop-offs early and schedule personal trainer check-ins.',
  },
];

export const BannerCard: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgError, setImgError] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const slide = BANNER_SLIDES[currentSlide];

  // Primary photorealistic gym banner image with high-res fallback
  const bannerImageSrc = imgError
    ? '/images/heavy_dumbbells.jpg'
    : '/images/banner_gym_rack.jpg';

  return (
    <div
      onClick={nextSlide}
      className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-[#0C1322] via-[#111A2E] to-[#0A0E18] text-white p-3 sm:p-3.5 shadow-2xs cursor-pointer select-none border border-white/10 group min-h-[98px] sm:min-h-[106px] flex items-center"
      role="region"
      aria-label="Gym Announcement Banner"
    >
      {/* Photorealistic Gym Banner Image Layer */}
      <div className="absolute right-0 top-0 bottom-0 w-[50%] sm:w-[46%] pointer-events-none overflow-hidden">
        {/* Real photorealistic gym dumbbells image */}
        <img
          src={bannerImageSrc}
          alt="Heavy gym dumbbells rack"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Ambient warm spotlight effect overlay */}
        <div
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(30, 58, 138, 0.25) 55%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Seamless left fade gradient: ensures zero text/dumbbell clash and feather blend */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0C1322] via-[#0C1322]/85 to-transparent"
          style={{ width: '45%' }}
        />

        {/* Subtle vertical vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C1322]/30 via-transparent to-[#0C1322]/40" />
      </div>

      {/* Content Column - readable, clear hierarchy, compact */}
      <div className="relative z-10 max-w-[210px] sm:max-w-xs flex flex-col justify-center">
        <div>
          {/* Kicker with subtle brand indicator */}
          <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[9.5px] font-bold tracking-widest text-[#FF963D] uppercase mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7418]" />
            {slide.kicker}
          </span>

          {/* Title */}
          <h2 className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight leading-snug mb-0.5">
            {slide.title}
          </h2>

          {/* Subtitle / Description */}
          <p className="text-[11px] sm:text-[11.5px] text-white/80 leading-snug font-normal line-clamp-2">
            {slide.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
