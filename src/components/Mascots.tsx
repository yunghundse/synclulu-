import React from 'react';

// Sailor Mascot - für leere Zustände, Fehler
export const SailorMascot: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 200
}) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 200 260" className={className}>
    {/* Halo */}
    <ellipse cx="100" cy="20" rx="45" ry="8" fill="none" stroke="url(#haloGradient)" strokeWidth="3" opacity="0.8"/>

    {/* Hair - Pastel gradient */}
    <ellipse cx="100" cy="75" rx="40" ry="35" fill="url(#hairGradient)"/>
    <circle cx="70" cy="60" r="15" fill="url(#hairGradient)"/>
    <circle cx="130" cy="60" r="15" fill="url(#hairGradient)"/>
    <circle cx="60" cy="80" r="12" fill="url(#hairGradient)"/>
    <circle cx="140" cy="80" r="12" fill="url(#hairGradient)"/>

    {/* Sailor Hat */}
    <ellipse cx="100" cy="45" rx="35" ry="10" fill="white" stroke="#2d3748" strokeWidth="2"/>
    <rect x="70" y="35" width="60" height="12" fill="white" stroke="#2d3748" strokeWidth="2"/>
    <text x="100" y="46" textAnchor="middle" fontSize="10" fill="#4a5568">⚓</text>

    {/* Face */}
    <ellipse cx="100" cy="95" rx="35" ry="32" fill="#fce4c4"/>

    {/* Eyes - worried expression */}
    <ellipse cx="85" cy="90" rx="8" ry="10" fill="white"/>
    <ellipse cx="115" cy="90" rx="8" ry="10" fill="white"/>
    <circle cx="85" cy="92" r="5" fill="#2d3748"/>
    <circle cx="115" cy="92" r="5" fill="#2d3748"/>
    <circle cx="87" cy="90" r="2" fill="white"/>
    <circle cx="117" cy="90" r="2" fill="white"/>

    {/* Worried eyebrows */}
    <path d="M75 82 Q85 78 92 82" fill="none" stroke="#2d3748" strokeWidth="2"/>
    <path d="M108 82 Q115 78 125 82" fill="none" stroke="#2d3748" strokeWidth="2"/>

    {/* Mouth - worried */}
    <path d="M92 108 Q100 105 108 108" fill="none" stroke="#2d3748" strokeWidth="2"/>

    {/* Body - Sailor outfit */}
    <path d="M65 130 Q60 160 65 200 L135 200 Q140 160 135 130 Z" fill="#2d3748"/>

    {/* Collar */}
    <path d="M70 130 L100 155 L130 130" fill="none" stroke="#5a7fa8" strokeWidth="3"/>
    <rect x="75" y="125" width="50" height="15" fill="#2d3748"/>

    {/* Tie */}
    <path d="M95 145 L100 165 L105 145 Z" fill="#a8d5e5"/>
    <circle cx="100" cy="142" r="5" fill="#a8d5e5"/>

    {/* Stripes on sleeves */}
    <rect x="60" y="175" width="20" height="3" fill="#5a7fa8"/>
    <rect x="60" y="180" width="20" height="3" fill="#5a7fa8"/>
    <rect x="120" y="175" width="20" height="3" fill="#5a7fa8"/>
    <rect x="120" y="180" width="20" height="3" fill="#5a7fa8"/>

    {/* Arms */}
    <rect x="50" y="140" width="18" height="50" rx="8" fill="#2d3748"/>
    <rect x="132" y="140" width="18" height="50" rx="8" fill="#2d3748"/>

    {/* Hands */}
    <ellipse cx="59" cy="192" rx="10" ry="8" fill="#fce4c4"/>
    <ellipse cx="141" cy="192" rx="10" ry="8" fill="#fce4c4"/>

    {/* Legs */}
    <rect x="75" y="200" width="20" height="40" fill="#2d3748"/>
    <rect x="105" y="200" width="20" height="40" fill="#2d3748"/>

    {/* Shoes */}
    <ellipse cx="85" cy="245" rx="15" ry="8" fill="#1a202c"/>
    <ellipse cx="115" cy="245" rx="15" ry="8" fill="#1a202c"/>

    <defs>
      <linearGradient id="haloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a8edea"/>
        <stop offset="50%" stopColor="#e8d5f2"/>
        <stop offset="100%" stopColor="#a8edea"/>
      </linearGradient>
      <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a8edea"/>
        <stop offset="50%" stopColor="#d4b8e8"/>
        <stop offset="100%" stopColor="#f5d0e8"/>
      </linearGradient>
    </defs>
  </svg>
);

// Pegasus Mascot - für Erfolge, positive Zustände
export const PegasusMascot: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 200
}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className={className}>
    {/* Halo */}
    <ellipse cx="100" cy="15" rx="40" ry="7" fill="none" stroke="url(#pegasusHalo)" strokeWidth="3" opacity="0.8"/>

    {/* Wings Left */}
    <g transform="translate(10, 80)">
      <path d="M50 30 Q30 10 10 25 Q25 20 35 30 Q20 15 5 35 Q25 25 40 40 Q30 30 20 50 Q35 35 50 50 Z" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    </g>

    {/* Wings Right */}
    <g transform="translate(140, 80) scale(-1, 1)">
      <path d="M50 30 Q30 10 10 25 Q25 20 35 30 Q20 15 5 35 Q25 25 40 40 Q30 30 20 50 Q35 35 50 50 Z" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    </g>

    {/* Body */}
    <ellipse cx="100" cy="120" rx="35" ry="30" fill="white" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Shirt */}
    <path d="M70 100 Q70 130 75 145 L125 145 Q130 130 130 100 Z" fill="#7dd3fc"/>

    {/* Head */}
    <ellipse cx="100" cy="65" rx="28" ry="25" fill="white" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Ears */}
    <ellipse cx="78" cy="45" rx="8" ry="12" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    <ellipse cx="78" cy="45" rx="4" ry="8" fill="#fce7f3"/>
    <ellipse cx="122" cy="45" rx="8" ry="12" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    <ellipse cx="122" cy="45" rx="4" ry="8" fill="#fce7f3"/>

    {/* Mane */}
    <path d="M85 35 Q95 25 100 35 Q105 25 115 35" fill="none" stroke="white" strokeWidth="8"/>

    {/* Glasses */}
    <circle cx="88" cy="62" r="12" fill="none" stroke="#4a5568" strokeWidth="2"/>
    <circle cx="112" cy="62" r="12" fill="none" stroke="#4a5568" strokeWidth="2"/>
    <line x1="100" y1="62" x2="100" y2="62" stroke="#4a5568" strokeWidth="2"/>
    <line x1="76" y1="60" x2="70" y2="55" stroke="#4a5568" strokeWidth="2"/>
    <line x1="124" y1="60" x2="130" y2="55" stroke="#4a5568" strokeWidth="2"/>

    {/* Eyes */}
    <circle cx="88" cy="62" r="6" fill="#1a202c"/>
    <circle cx="112" cy="62" r="6" fill="#1a202c"/>
    <circle cx="90" cy="60" r="2" fill="white"/>
    <circle cx="114" cy="60" r="2" fill="white"/>

    {/* Nose */}
    <ellipse cx="100" cy="75" rx="8" ry="5" fill="#fce7f3"/>
    <circle cx="96" cy="74" r="2" fill="#d1d5db"/>
    <circle cx="104" cy="74" r="2" fill="#d1d5db"/>

    {/* Smile */}
    <path d="M92 82 Q100 88 108 82" fill="none" stroke="#4a5568" strokeWidth="2"/>

    {/* Front Legs */}
    <rect x="80" y="145" width="12" height="35" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1"/>
    <rect x="108" y="145" width="12" height="35" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1"/>

    {/* Hooves */}
    <ellipse cx="86" cy="182" rx="8" ry="5" fill="#1a202c"/>
    <ellipse cx="114" cy="182" rx="8" ry="5" fill="#1a202c"/>

    {/* Tail */}
    <path d="M130 130 Q150 140 145 160 Q140 150 135 155 Q145 145 140 165" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"/>

    <defs>
      <linearGradient id="pegasusHalo" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a8edea"/>
        <stop offset="50%" stopColor="#d4b8e8"/>
        <stop offset="100%" stopColor="#a8edea"/>
      </linearGradient>
    </defs>
  </svg>
);

// Girl Mascot - für Willkommen, Onboarding
export const GirlMascot: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 200
}) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 200 260" className={className}>
    {/* Halo */}
    <ellipse cx="100" cy="15" rx="45" ry="8" fill="none" stroke="url(#girlHalo)" strokeWidth="3" opacity="0.8"/>

    {/* Hair - Fluffy pastel */}
    <ellipse cx="100" cy="70" rx="55" ry="50" fill="url(#girlHairGradient)"/>
    <circle cx="55" cy="55" r="20" fill="url(#girlHairGradient)"/>
    <circle cx="145" cy="55" r="20" fill="url(#girlHairGradient)"/>
    <circle cx="45" cy="80" r="18" fill="url(#girlHairGradient)"/>
    <circle cx="155" cy="80" r="18" fill="url(#girlHairGradient)"/>
    <circle cx="50" cy="110" r="15" fill="url(#girlHairGradient)"/>
    <circle cx="150" cy="110" r="15" fill="url(#girlHairGradient)"/>
    <circle cx="60" cy="130" r="12" fill="url(#girlHairGradient)"/>
    <circle cx="140" cy="130" r="12" fill="url(#girlHairGradient)"/>

    {/* Face */}
    <ellipse cx="100" cy="90" rx="35" ry="38" fill="#fce4c4"/>

    {/* Eyes - big curious */}
    <ellipse cx="82" cy="85" rx="12" ry="14" fill="white"/>
    <ellipse cx="118" cy="85" rx="12" ry="14" fill="white"/>
    <circle cx="82" cy="88" r="8" fill="#4a5568"/>
    <circle cx="118" cy="88" r="8" fill="#4a5568"/>
    <circle cx="85" cy="85" r="3" fill="white"/>
    <circle cx="121" cy="85" r="3" fill="white"/>

    {/* Eyebrows - slightly raised */}
    <path d="M70 72 Q82 68 90 72" fill="none" stroke="#9ca3af" strokeWidth="2"/>
    <path d="M110 72 Q118 68 130 72" fill="none" stroke="#9ca3af" strokeWidth="2"/>

    {/* Small nose */}
    <ellipse cx="100" cy="98" rx="3" ry="2" fill="#e8c4a8"/>

    {/* Mouth - slightly open */}
    <ellipse cx="100" cy="110" rx="6" ry="4" fill="#f5a5a5"/>
    <path d="M94 108 Q100 106 106 108" fill="none" stroke="#e88a8a" strokeWidth="1"/>

    {/* Collar */}
    <path d="M75 140 L100 160 L125 140" fill="white"/>
    <circle cx="100" cy="148" r="4" fill="#a8edea"/>

    {/* Bow tie */}
    <path d="M88 152 L100 158 L88 164 Z" fill="#a8edea"/>
    <path d="M112 152 L100 158 L112 164 Z" fill="#a8edea"/>
    <circle cx="100" cy="158" r="3" fill="#7dd3fc"/>

    {/* Dress */}
    <path d="M70 145 Q55 200 65 240 L135 240 Q145 200 130 145 Z" fill="#2d3748"/>

    {/* Dress collar area */}
    <path d="M70 145 Q100 155 130 145 L125 160 Q100 165 75 160 Z" fill="#2d3748"/>

    {/* Arms */}
    <path d="M55 155 Q45 180 50 200" fill="none" stroke="#2d3748" strokeWidth="18" strokeLinecap="round"/>
    <path d="M145 155 Q155 180 150 200" fill="none" stroke="#2d3748" strokeWidth="18" strokeLinecap="round"/>

    {/* Hands */}
    <ellipse cx="50" cy="205" rx="10" ry="8" fill="#fce4c4"/>
    <ellipse cx="150" cy="205" rx="10" ry="8" fill="#fce4c4"/>

    {/* Legs */}
    <rect x="80" y="235" width="15" height="15" fill="#fce4c4"/>
    <rect x="105" y="235" width="15" height="15" fill="#fce4c4"/>

    {/* Shoes */}
    <ellipse cx="87" cy="252" rx="12" ry="6" fill="#2d3748"/>
    <ellipse cx="113" cy="252" rx="12" ry="6" fill="#2d3748"/>

    <defs>
      <linearGradient id="girlHalo" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a8edea"/>
        <stop offset="50%" stopColor="#e8d5f2"/>
        <stop offset="100%" stopColor="#a8edea"/>
      </linearGradient>
      <linearGradient id="girlHairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a8edea"/>
        <stop offset="30%" stopColor="#c4b5e8"/>
        <stop offset="70%" stopColor="#e8c5d8"/>
        <stop offset="100%" stopColor="#a8edea"/>
      </linearGradient>
    </defs>
  </svg>
);

// Animated floating wrapper
export const FloatingMascot: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => (
  <div
    className={`animate-bounce ${className}`}
    style={{
      animationDuration: '3s',
      animationDelay: `${delay}s`,
      animationTimingFunction: 'ease-in-out'
    }}
  >
    {children}
  </div>
);

export default { SailorMascot, PegasusMascot, GirlMascot, FloatingMascot };
