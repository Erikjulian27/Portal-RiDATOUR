import React from 'react';
import { Plane } from 'lucide-react';

export const Logo = ({ size = 'default', showText = true }) => {
  const sizes = {
    small: { icon: 20, text: 'text-lg' },
    default: { icon: 28, text: 'text-xl' },
    large: { icon: 40, text: 'text-3xl' }
  };

  const { icon, text } = sizes[size] || sizes.default;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-violet-700 rounded-full p-2 flex items-center justify-center">
        <Plane className="text-white" size={icon} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-heading font-bold text-violet-700 ${text} leading-tight`}>
            RiDA<span className="text-amber-600">TOUR</span>
          </span>
          <span className="text-[10px] text-slate-500 leading-tight">Treat you like family</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
