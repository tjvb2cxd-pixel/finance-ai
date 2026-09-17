import React from 'react';

interface FinAvatarProps {
  className?: string;
  isThinking?: boolean;
}

export const FinAvatar: React.FC<FinAvatarProps> = ({ className = 'w-44 h-44', isThinking = false }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Holographic Glow Rings */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/15 blur-xl animate-pulse" />
      
      {/* Outer Cyber Circuit Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-45" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r="72"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeDasharray="8 6 2 6"
          opacity="0.5"
        />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.4"
        />
      </svg>

      {/* FIN Character Illustration */}
      <svg viewBox="0 0 180 180" className="w-full h-full relative z-10 filter drop-shadow-[0_8px_20px_rgba(var(--theme-glow-rgb),0.35)]">
        <defs>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a192f" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="neonCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffdfc4" />
            <stop offset="100%" stopColor="#f3b692" />
          </linearGradient>

          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
        </defs>

        {/* Halo Glow behind head */}
        <circle cx="90" cy="80" r="54" fill="#00f0ff" opacity="0.12" filter="blur(8px)" />

        {/* Body & Futuristic Cyber Suit */}
        <path
          d="M40 170 C40 142 55 130 90 130 C125 130 140 142 140 170 Z"
          fill="url(#suitGrad)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Chest Plate Cyber Details */}
        <path
          d="M60 145 L90 156 L120 145"
          fill="none"
          stroke="url(#neonCyanGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Suit Collar Glow */}
        <path
          d="M72 132 C82 137 98 137 108 132"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* "FIN" Badge on chest */}
        <text
          x="90"
          y="170"
          textAnchor="middle"
          fill="#00f0ff"
          fontSize="10"
          fontWeight="900"
          letterSpacing="1.5"
          filter="drop-shadow(0 0 4px #00f0ff)"
        >
          FIN
        </text>

        {/* Neck */}
        <path d="M78 110 L78 130 C86 134 94 134 102 130 L102 110 Z" fill="#e8a883" />

        {/* Face Shape */}
        <path
          d="M65 72 C65 110 76 122 90 122 C104 122 115 110 115 72 C115 50 102 44 90 44 C78 44 65 50 65 72 Z"
          fill="url(#skinGrad)"
        />

        {/* Ears */}
        <ellipse cx="63" cy="80" rx="4" ry="7" fill="#f3b692" />
        <ellipse cx="117" cy="80" rx="4" ry="7" fill="#f3b692" />

        {/* Cyber Neon Headphones */}
        {/* Headband */}
        <path
          d="M56 75 C54 36 126 36 124 75"
          fill="none"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M60 70 C58 40 122 40 120 70"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Headphone Ear Cups */}
        <rect x="52" y="68" width="10" height="24" rx="5" fill="#0b1329" stroke="#00f0ff" strokeWidth="2" />
        <rect x="118" y="68" width="10" height="24" rx="5" fill="#0b1329" stroke="#00f0ff" strokeWidth="2" />
        <circle cx="57" cy="80" r="3" fill="#00f0ff" />
        <circle cx="123" cy="80" r="3" fill="#00f0ff" />

        {/* Hair - Stylized modern dark cyber crop */}
        <path
          d="M65 65 C62 50 72 36 90 36 C108 36 118 50 115 65 C112 55 106 48 94 48 C82 48 74 54 65 65 Z"
          fill="url(#hairGrad)"
        />
        <path
          d="M68 62 C74 48 85 46 95 44 C88 47 80 54 75 62 Z"
          fill="#334155"
        />

        {/* Eyebrows */}
        <path d="M72 68 Q80 66 84 69" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M96 69 Q100 66 108 68" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="78" cy="76" rx="4" ry="4.5" fill="#0f172a" />
        <ellipse cx="102" cy="76" rx="4" ry="4.5" fill="#0f172a" />
        {/* Eye Irises */}
        <circle cx="78.5" cy="76" r="2.8" fill="url(#eyeGlow)" />
        <circle cx="101.5" cy="76" r="2.8" fill="url(#eyeGlow)" />
        {/* Eye Highlights */}
        <circle cx="77.5" cy="74.5" r="1.2" fill="#ffffff" />
        <circle cx="100.5" cy="74.5" r="1.2" fill="#ffffff" />

        {/* Nose */}
        <path d="M90 79 L89 86 L92 86" fill="none" stroke="#df9b77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Confident Friendly Smile */}
        <path
          d="M83 94 Q90 101 97 94"
          fill="none"
          stroke="#b45309"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Subtle Cheek glow */}
        <circle cx="74" cy="85" r="4" fill="#f87171" opacity="0.3" filter="blur(2px)" />
        <circle cx="106" cy="85" r="4" fill="#f87171" opacity="0.3" filter="blur(2px)" />
      </svg>

      {/* Floating Status Ring Indicator */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-[#091428] border border-cyan-500/50 rounded-full px-2 py-0.5 shadow-lg">
        <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
        <span className="text-[9px] font-bold text-cyan-300 tracking-wide font-mono">
          {isThinking ? 'PENSANDO...' : 'ONLINE'}
        </span>
      </div>
    </div>
  );
};
