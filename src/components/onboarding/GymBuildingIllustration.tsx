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
      <img
        src="/images/Screenshot_2026_1019_170605.jpg"
        alt="Gym Building"
        className="w-full h-auto max-h-[220px] object-contain select-none"
        style={{ objectFit: 'contain' }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
