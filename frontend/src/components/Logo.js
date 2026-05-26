import React from 'react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_hajj-ops-1/artifacts/7t8146sg_logo-ridatour.png";

export const Logo = ({ size = 'default' }) => {
  const sizes = {
    small: 'h-8',
    default: 'h-12',
    large: 'h-16'
  };

  const heightClass = sizes[size] || sizes.default;

  return (
    <div className="flex items-center">
      <img 
        src={LOGO_URL} 
        alt="RiDATOUR - Treat you like family" 
        className={`${heightClass} w-auto object-contain`}
      />
    </div>
  );
};

export default Logo;
