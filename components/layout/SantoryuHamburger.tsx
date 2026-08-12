import React, { useState, useEffect } from 'react';
import './SantoryuHamburger.css';

export interface SantoryuHamburgerProps {
  /** Optional controlled active state */
  isOpen?: boolean;
  /** Callback fired when menu state toggles */
  onToggle?: (isOpen: boolean) => void;
  /** Additional custom wrapper CSS class */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

export const SantoryuHamburger: React.FC<SantoryuHamburgerProps> = ({
  isOpen: externalIsOpen,
  onToggle,
  className = '',
  ariaLabel = 'Toggle Navigation Menu',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [isSlashing, setIsSlashing] = useState<boolean>(false);

  // Support both controlled and uncontrolled usage
  const isControlled = externalIsOpen !== undefined;
  const active = isControlled ? externalIsOpen : internalIsOpen;

  const handleClick = () => {
    const nextState = !active;

    if (!active) {
      setIsSlashing(true);
    }

    if (!isControlled) {
      setInternalIsOpen(nextState);
    }

    onToggle?.(nextState);
  };

  useEffect(() => {
    if (!isSlashing) return;
    const timer = setTimeout(() => {
      setIsSlashing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [isSlashing]);

  return (
    <div className={`santoryu-menu-wrapper ${className}`.trim()}>
      <button
        type="button"
        className={`santoryu-toggle ${active ? 'active' : ''} ${isSlashing ? 'slash-active' : ''}`}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-expanded={active}
      >
        {/* Zoro's Haki Glow Background */}
        <div className="haki-aura" />

        {/* Anime Sword Slash Effect Overlay */}
        <div className="slash-fx" />

        {/* Katanas SVG */}
        <svg className="katana-svg" viewBox="0 0 120 120">
          <defs>
            {/* Steel Blade Metallic Gradient */}
            <linearGradient id="steelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="40%" stopColor="#E2E8F0" />
              <stop offset="70%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Gold Accent Gradient */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Metallic Sheen Sweep Filter */}
            <linearGradient id="glintGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* 1. TOP KATANA: Wado Ichimonji (Pure White) */}
          <g className="katana top-katana">
            <rect x="36" y="27" width="62" height="6" rx="2" fill="#FAFAFA" stroke="#CBD5E1" strokeWidth="0.8" />
            <rect x="92" y="27" width="6" height="6" rx="1" fill="url(#goldGradient)" />

            <g className="blade-hilt-group">
              <path d="M 28 28.5 L 65 28.5 L 65 31.5 L 28 31.5 Z" fill="url(#steelGradient)" />
              <rect className="glint-light" x="32" y="28" width="12" height="4" fill="url(#glintGrad)" />
              <circle cx="28" cy="30" r="5.5" fill="url(#goldGradient)" stroke="#78350F" strokeWidth="0.6" />
              <rect x="8" y="27" width="20" height="6" rx="1.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.6" />
              <polygon points="11,30 13,28 15,30 13,32" fill="#CBD5E1" />
              <polygon points="16,30 18,28 20,30 18,32" fill="#CBD5E1" />
              <polygon points="21,30 23,28 25,30 23,32" fill="#CBD5E1" />
              <rect x="6" y="27" width="3" height="6" rx="1" fill="url(#goldGradient)" />
            </g>
          </g>

          {/* 2. MIDDLE KATANA: Sandai Kitetsu (Crimson) */}
          <g className="katana middle-katana">
            <rect x="36" y="57" width="62" height="6" rx="2" fill="#991B1B" stroke="#7F1D1D" strokeWidth="0.8" />
            <rect x="52" y="57" width="4" height="6" fill="#18181B" />
            <rect x="68" y="57" width="4" height="6" fill="#18181B" />
            <rect x="92" y="57" width="6" height="6" rx="1" fill="#18181B" />

            <g className="blade-hilt-group">
              <path d="M 28 58.5 L 65 58.5 L 65 61.5 L 28 61.5 Z" fill="url(#steelGradient)" />
              <line x1="30" y1="61" x2="62" y2="61" stroke="#991B1B" strokeWidth="0.6" opacity="0.8" />
              <rect className="glint-light" x="32" y="58" width="12" height="4" fill="url(#glintGrad)" />
              <path
                d="M 25 57 H 31 V 55 H 25 Z M 25 63 H 31 V 65 H 25 Z M 27 55 H 29 V 65 H 27 Z"
                fill="#18181B"
                stroke="#451A03"
                strokeWidth="0.5"
              />
              <rect x="8" y="57" width="20" height="6" rx="1.5" fill="#991B1B" stroke="#450A0A" strokeWidth="0.6" />
              <polygon points="11,60 13,58 15,60 13,62" fill="#18181B" />
              <polygon points="16,60 18,58 20,60 18,62" fill="#18181B" />
              <polygon points="21,60 23,58 25,60 23,62" fill="#18181B" />
              <rect x="6" y="57" width="3" height="6" rx="1" fill="url(#goldGradient)" />
            </g>
          </g>

          {/* 3. BOTTOM KATANA: Enma (Royal Purple) */}
          <g className="katana bottom-katana">
            <rect x="36" y="87" width="62" height="6" rx="2" fill="#581C87" stroke="#3B0764" strokeWidth="0.8" />
            <circle cx="50" cy="90" r="1.2" fill="url(#goldGradient)" />
            <circle cx="66" cy="90" r="1.2" fill="url(#goldGradient)" />
            <circle cx="82" cy="90" r="1.2" fill="url(#goldGradient)" />
            <rect x="92" y="87" width="6" height="6" rx="1" fill="url(#goldGradient)" />

            <g className="blade-hilt-group">
              <path d="M 28 88.5 L 65 88.5 L 65 91.5 L 28 91.5 Z" fill="url(#steelGradient)" />
              <rect className="glint-light" x="32" y="88" width="12" height="4" fill="url(#glintGrad)" />
              <path
                d="M 28 84 A 3.5 3.5 0 0 1 31.5 87.5 A 3.5 3.5 0 0 1 31.5 92.5 A 3.5 3.5 0 0 1 28 96 A 3.5 3.5 0 0 1 24.5 92.5 A 3.5 3.5 0 0 1 24.5 87.5 A 3.5 3.5 0 0 1 28 84 Z"
                fill="url(#goldGradient)"
                stroke="#581C87"
                strokeWidth="0.5"
              />
              <rect x="8" y="87" width="20" height="6" rx="1.5" fill="#581C87" stroke="#2E1065" strokeWidth="0.6" />
              <polygon points="11,90 13,88 15,90 13,92" fill="url(#goldGradient)" />
              <polygon points="16,90 18,88 20,90 18,92" fill="url(#goldGradient)" />
              <polygon points="21,90 23,88 25,90 23,92" fill="url(#goldGradient)" />
              <rect x="6" y="87" width="3" height="6" rx="1" fill="url(#goldGradient)" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
};
