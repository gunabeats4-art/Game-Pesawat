import React from 'react';
import { RankEmblemMotif } from '../game/rankEmblems';

interface RankEmblemSVGProps {
  motif: RankEmblemMotif;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  unlocked?: boolean;
  className?: string;
}

export const RankEmblemSVG: React.FC<RankEmblemSVGProps> = ({
  motif,
  primaryColor = '#f59e0b',
  secondaryColor = '#78350f',
  size = 48,
  unlocked = true,
  className = '',
}) => {
  const primary = unlocked ? primaryColor : '#64748b';
  const secondary = unlocked ? secondaryColor : '#1e293b';

  switch (motif) {
    case 'cadet_wings':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 6 L40 20 L34 26 L24 16 L14 26 L8 20 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <polygon points="24,14 36,36 24,28 12,36" fill={primary} fillOpacity="0.5" stroke={primary} strokeWidth="2" />
          <circle cx="24" cy="22" r="3.5" fill="#ffffff" />
        </svg>
      );

    case 'single_star':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <path d="M24 12 L27.5 21 L37 21 L29.5 26.5 L32 36 L24 30.5 L16 36 L18.5 26.5 L11 21 L20.5 21 Z" fill={primary} />
          <circle cx="24" cy="24" r="3" fill="#ffffff" />
        </svg>
      );

    case 'twin_star':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 4 L42 12 V28 C42 37 24 44 24 44 C24 44 6 37 6 28 V12 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <path d="M16 18 L18 24 L24 24 L19 28 L21 34 L16 30 L11 34 L13 28 L8 24 L14 24 Z" fill={primary} />
          <path d="M32 18 L34 24 L40 24 L35 28 L37 34 L32 30 L27 34 L29 28 L24 24 L30 24 Z" fill={primary} />
          <circle cx="16" cy="25" r="2" fill="#ffffff" />
          <circle cx="32" cy="25" r="2" fill="#ffffff" />
        </svg>
      );

    case 'triple_star':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <polygon points="24,3 44,15 36,42 12,42 4,15" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <polygon points="24,10 38,20 32,38 16,38 10,20" fill={primary} fillOpacity="0.35" stroke={primary} strokeWidth="1.5" />
          <circle cx="16" cy="22" r="3" fill={primary} />
          <circle cx="24" cy="18" r="3.5" fill="#ffffff" />
          <circle cx="32" cy="22" r="3" fill={primary} />
          <line x1="12" y1="34" x2="36" y2="34" stroke={primary} strokeWidth="2.5" strokeDasharray="4 2" />
        </svg>
      );

    case 'squadron_diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <polygon points="24,3 45,24 24,45 3,24" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <polygon points="24,11 37,24 24,37 11,24" fill={primary} fillOpacity="0.4" stroke={primary} strokeWidth="2" />
          <path d="M24 16 L26.5 22 L33 22 L28 26 L30 32 L24 28 L18 32 L20 26 L15 22 L21.5 22 Z" fill="#ffffff" />
        </svg>
      );

    case 'wing_commander':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <polygon points="24,3 44,14 44,24 24,35 4,24 4,14" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <polygon points="24,14 44,25 24,45 4,25" fill={secondary} stroke={primary} strokeWidth="2" fillOpacity="0.6" />
          <path d="M24 8 L27 16 L35 16 L29 21 L31 29 L24 24 L17 29 L19 21 L13 16 L21 16 Z" fill={primary} />
          <circle cx="24" cy="20" r="3.5" fill="#ffffff" />
        </svg>
      );

    case 'group_captain':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="20" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <path d="M12 28 C10 20 14 12 24 10 C34 12 38 20 36 28 C32 34 24 38 24 38 C24 38 16 34 12 28 Z" fill={primary} fillOpacity="0.3" stroke={primary} strokeWidth="2" />
          <path d="M24 12 L27.5 20 L36 20 L29 25 L32 34 L24 28.5 L16 34 L19 25 L12 20 L20.5 20 Z" fill={primary} />
          <circle cx="24" cy="23" r="4" fill="#ffffff" />
        </svg>
      );

    case 'air_commodore':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 2 L29 14 L42 16 L32 25 L35 38 L24 31 L13 38 L16 25 L6 16 L19 14 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
          <circle cx="24" cy="23" r="11" fill={primary} fillOpacity="0.4" stroke={primary} strokeWidth="2" />
          <path d="M24 16 L26 21 L31 21 L27 24 L29 29 L24 26 L19 29 L21 24 L17 21 L22 21 Z" fill="#ffffff" />
          <circle cx="24" cy="23" r="3" fill={primary} />
        </svg>
      );

    case 'vice_marshal':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M10 14 L24 4 L38 14 V32 C38 40 24 45 24 45 C24 45 10 40 10 32 Z" fill={secondary} stroke={primary} strokeWidth="2.5" />
          {/* Imperial Crown Top */}
          <path d="M14 16 L18 22 L24 15 L30 22 L34 16 L32 26 H16 Z" fill={primary} />
          <circle cx="14" cy="14" r="2" fill="#ffffff" />
          <circle cx="24" cy="12" r="2.5" fill="#ffffff" />
          <circle cx="34" cy="14" r="2" fill="#ffffff" />
          <polygon points="24,28 30,38 18,38" fill={primary} fillOpacity="0.6" stroke={primary} strokeWidth="1.5" />
        </svg>
      );

    case 'air_marshal':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          {/* Outer Radiant Starburst */}
          <path d="M24 2 L28 12 L38 6 L34 17 L45 18 L37 26 L44 35 L33 34 L34 45 L24 38 L14 45 L15 34 L4 35 L11 26 L3 18 L14 17 L10 6 L20 12 Z" fill={secondary} stroke={primary} strokeWidth="2" />
          {/* Inner Golden Escutcheon */}
          <polygon points="24,10 38,22 32,38 16,38 10,22" fill="#f59e0b" fillOpacity="0.35" stroke="#fbbf24" strokeWidth="2" />
          {/* Sovereign Crown Motif */}
          <path d="M15 22 L19 28 L24 20 L29 28 L33 22 L31 32 H17 Z" fill="#f43f5e" />
          <circle cx="15" cy="20" r="2" fill="#ffffff" />
          <circle cx="24" cy="17" r="3" fill="#ffffff" />
          <circle cx="33" cy="20" r="2" fill="#ffffff" />
          <circle cx="24" cy="26" r="3" fill="#ffffff" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <polygon points="24,4 42,38 6,38" fill={secondary} stroke={primary} strokeWidth="2" />
        </svg>
      );
  }
};
