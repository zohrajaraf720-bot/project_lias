import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  iconClassName?: string;
  rounded?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Photo de profil',
  size = 'md',
  className = '',
  iconClassName = '',
  rounded = 'rounded-2xl',
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError if src changes
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  const getFullUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || !url.trim()) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      return `http://localhost:8080${path}`;
    }
    return path;
  };

  const finalSrc = getFullUrl(src);

  const sizeMap = {
    xs: { box: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { box: 'w-12 h-12', icon: 'w-6 h-6' },
    xl: { box: 'w-16 h-16', icon: 'w-8 h-8' },
    '2xl': { box: 'w-20 h-20 sm:w-24 sm:h-24', icon: 'w-10 h-10 sm:w-12 sm:h-12' },
  }[size];

  if (finalSrc && !imgError) {
    return (
      <div
        className={`relative overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200/80 ${sizeMap.box} ${rounded} ${className}`}
      >
        <img
          src={finalSrc}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Profile icon fallback when no picture exists
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-400 border border-slate-200/80 ${sizeMap.box} ${rounded} ${className}`}
      title={alt}
    >
      <User className={`${sizeMap.icon} text-slate-400 ${iconClassName}`} />
    </div>
  );
};
