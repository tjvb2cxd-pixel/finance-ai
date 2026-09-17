import React from 'react';

interface AvatarProps {
  className?: string;
  size?: number;
}

// 1. Roberto Avatar (Blonde hair with cyan & pink highlights, bright pink background, blue suit with yellow collar)
export const RobertoAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pink Background */}
    <rect width="120" height="120" rx="24" fill="#ec4899" />
    <circle cx="60" cy="60" r="50" fill="#f43f5e" fillOpacity="0.4" />

    {/* Body / Clothes */}
    <path d="M26 120C26 95 40 86 60 86C80 86 94 95 94 120H26Z" fill="#1e3a8a" />
    {/* Shirt collar - yellow */}
    <path d="M50 86L60 102L70 86L60 90L50 86Z" fill="#fde047" />
    <path d="M60 92L54 86H66L60 92Z" fill="#eab308" />

    {/* Neck */}
    <rect x="52" y="74" width="16" height="15" rx="3" fill="#fed7aa" />

    {/* Head / Face */}
    <circle cx="60" cy="58" r="22" fill="#fed7aa" />

    {/* Cheeks */}
    <circle cx="48" cy="63" r="3.5" fill="#f472b6" fillOpacity="0.8" />
    <circle cx="72" cy="63" r="3.5" fill="#f472b6" fillOpacity="0.8" />

    {/* Eyes */}
    <circle cx="51" cy="55" r="2.5" fill="#0f172a" />
    <circle cx="69" cy="55" r="2.5" fill="#0f172a" />
    <circle cx="52" cy="54" r="0.8" fill="#ffffff" />
    <circle cx="70" cy="54" r="0.8" fill="#ffffff" />

    {/* Eyebrows */}
    <path d="M47 50C49 48.5 53 48.5 55 50" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M65 50C67 48.5 71 48.5 73 50" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />

    {/* Smile */}
    <path d="M54 65C57 69 63 69 66 65" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />

    {/* Hair Base: blonde */}
    <path
      d="M38 52C36 68 37 84 42 95C45 92 46 84 46 76C46 58 45 42 60 38C75 42 74 58 74 76C74 84 75 92 78 95C83 84 84 68 82 52C80 34 72 26 60 26C48 26 40 34 38 52Z"
      fill="#fef08a"
    />
    <path
      d="M36 50C34 68 35 84 40 95C43 93 45 86 45 78C45 56 46 42 60 38C74 42 75 56 75 78C75 86 77 93 80 95C85 84 86 68 84 50C82 32 73 24 60 24C47 24 38 32 36 50Z"
      fill="#fde047"
    />

    {/* Bangs */}
    <path
      d="M40 42C48 38 52 46 60 40C68 46 72 38 80 42C76 34 69 30 60 30C51 30 44 34 40 42Z"
      fill="#facc15"
    />

    {/* Left hair cyan streak */}
    <path
      d="M37 54C36 68 37 82 41 93C42 88 41 78 40 68C39 58 39 52 42 46C39 49 38 51 37 54Z"
      fill="#38bdf8"
    />

    {/* Right hair pink streak */}
    <path
      d="M83 54C84 68 83 82 79 93C78 88 79 78 80 68C81 58 81 52 78 46C81 49 82 51 83 54Z"
      fill="#f43f5e"
    />
  </svg>
);

// 2. Elfo Avatar (Green skin, big pointy ears, purple beanie, round eyes, smiling with buck tooth, red collar)
export const ElfoAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cyan / Blue Background */}
    <rect width="120" height="120" rx="24" fill="#0284c7" />
    <circle cx="60" cy="60" r="50" fill="#0369a1" fillOpacity="0.4" />

    {/* Red Shirt */}
    <path d="M26 120C26 96 38 86 60 86C82 86 94 96 94 120H26Z" fill="#dc2626" />
    <path d="M50 86L60 98L70 86H50Z" fill="#991b1b" />

    {/* Pointy Elf Ears */}
    {/* Left Ear */}
    <path d="M42 56C30 52 14 48 18 60C22 68 36 64 42 66V56Z" fill="#4ade80" />
    <path d="M38 56C28 54 20 52 22 59C24 63 32 61 38 62V56Z" fill="#86efac" />
    {/* Right Ear */}
    <path d="M78 56C90 52 106 48 102 60C98 68 84 64 78 66V56Z" fill="#4ade80" />
    <path d="M82 56C92 54 100 52 98 59C96 63 88 61 82 62V56Z" fill="#86efac" />

    {/* Head / Face: Green */}
    <circle cx="60" cy="60" r="24" fill="#4ade80" />

    {/* Nose */}
    <circle cx="60" cy="63" r="3.5" fill="#22c55e" />

    {/* Eyes: Large white with black pupils looking slightly up */}
    <circle cx="49" cy="54" r="7.5" fill="#ffffff" stroke="#166534" strokeWidth="1" />
    <circle cx="71" cy="54" r="7.5" fill="#ffffff" stroke="#166534" strokeWidth="1" />
    <circle cx="50" cy="53" r="3.5" fill="#0f172a" />
    <circle cx="72" cy="53" r="3.5" fill="#0f172a" />
    <circle cx="51.5" cy="51.5" r="1.2" fill="#ffffff" />
    <circle cx="73.5" cy="51.5" r="1.2" fill="#ffffff" />

    {/* Cheerful wide mouth */}
    <path d="M48 68C48 78 72 78 72 68H48Z" fill="#14532d" />
    <path d="M52 74C56 77 64 77 68 74C65 77 55 77 52 74Z" fill="#ef4444" />
    {/* Single cute white buck tooth */}
    <rect x="56.5" y="68" width="5.5" height="5" rx="1" fill="#ffffff" />

    {/* Purple Beanie / Elf Cap */}
    <path
      d="M34 46C34 32 44 24 60 24C76 24 86 32 86 46C86 49 84 50 78 50C70 50 66 46 60 46C54 46 50 50 42 50C36 50 34 49 34 46Z"
      fill="#7c3aed"
    />
    <path
      d="M30 46C30 43 36 42 60 42C84 42 90 43 90 46C90 48 84 50 60 50C36 50 30 48 30 46Z"
      fill="#9333ea"
    />
  </svg>
);

// 3. Rainha Avatar (Gold crown with gems, royal dark hair, pearl necklace, blue gown, dark background)
export const RainhaAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark Navy Background */}
    <rect width="120" height="120" rx="24" fill="#0f172a" />
    <circle cx="60" cy="60" r="50" fill="#1e293b" fillOpacity="0.5" />

    {/* Royal Blue Dress */}
    <path d="M26 120C26 95 38 88 60 88C82 88 94 95 94 120H26Z" fill="#1d4ed8" />
    <path d="M46 88L60 102L74 88H46Z" fill="#f8fafc" fillOpacity="0.2" />

    {/* Neck */}
    <rect x="52" y="72" width="16" height="16" rx="3" fill="#ffedd5" />

    {/* Pearl Necklace */}
    <circle cx="44" cy="85" r="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="49" cy="86" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="55" cy="87" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="60" cy="87.5" r="2.7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="65" cy="87" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="71" cy="86" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <circle cx="76" cy="85" r="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />

    {/* Face */}
    <circle cx="60" cy="58" r="21" fill="#ffedd5" />

    {/* Dark Hair Bun / Surrounding Hair */}
    <path
      d="M37 56C36 70 38 78 43 82C44 76 43 65 44 56C44 42 48 36 60 36C72 36 76 42 76 56C77 65 76 76 77 82C82 78 84 70 83 56C82 38 73 30 60 30C47 30 38 38 37 56Z"
      fill="#1e1b4b"
    />
    {/* Hair Top Volume */}
    <circle cx="60" cy="38" r="16" fill="#1e1b4b" />

    {/* Crown */}
    <path
      d="M45 40L42 26L50 32L60 22L70 32L78 26L75 40H45Z"
      fill="#eab308"
      stroke="#ca8a04"
      strokeWidth="1"
    />
    <circle cx="60" cy="34" r="2" fill="#dc2626" />
    <circle cx="50" cy="35" r="1.5" fill="#0284c7" />
    <circle cx="70" cy="35" r="1.5" fill="#0284c7" />
    <circle cx="42" cy="25" r="1.5" fill="#facc15" />
    <circle cx="60" cy="21" r="1.8" fill="#facc15" />
    <circle cx="78" cy="25" r="1.5" fill="#facc15" />

    {/* Earrings */}
    <circle cx="39" cy="62" r="2" fill="#ffffff" />
    <circle cx="81" cy="62" r="2" fill="#ffffff" />

    {/* Eyes */}
    <ellipse cx="52" cy="56" rx="2.5" ry="2" fill="#0f172a" />
    <ellipse cx="68" cy="56" rx="2.5" ry="2" fill="#0f172a" />
    <circle cx="53" cy="55.2" r="0.7" fill="#ffffff" />
    <circle cx="69" cy="55.2" r="0.7" fill="#ffffff" />

    {/* Eyebrows */}
    <path d="M48 51C50 49.5 54 49.5 56 51" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M64 51C66 49.5 70 49.5 72 51" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" />

    {/* Red Lipstick Smile */}
    <path d="M55 66C57 69 63 69 65 66" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="48" cy="63" r="2.5" fill="#f43f5e" fillOpacity="0.4" />
    <circle cx="72" cy="63" r="2.5" fill="#f43f5e" fillOpacity="0.4" />
  </svg>
);

// 4. Wandinha Avatar (Deep purple background, pale face, black bangs & braids, dark collar dress)
export const WandinhaAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Deep Purple Background */}
    <rect width="120" height="120" rx="24" fill="#3b0764" />
    <circle cx="60" cy="60" r="50" fill="#581c87" fillOpacity="0.5" />

    {/* Black Dress */}
    <path d="M26 120C26 95 38 88 60 88C82 88 94 95 94 120H26Z" fill="#09090b" />

    {/* White Pointed Wednesday Collar */}
    <path d="M48 88L60 102L50 106L38 92L48 88Z" fill="#ffffff" />
    <path d="M72 88L60 102L70 106L82 92L72 88Z" fill="#ffffff" />
    <path d="M58 92L60 114L62 92H58Z" fill="#18181b" />

    {/* Neck */}
    <rect x="53" y="74" width="14" height="14" rx="2" fill="#ede9fe" />

    {/* Pale Lilac / White Face */}
    <circle cx="60" cy="59" r="21" fill="#ede9fe" />

    {/* Wednesday Two Braided Pigtails */}
    {/* Left Braid */}
    <g>
      <ellipse cx="34" cy="64" rx="4.5" ry="5.5" fill="#09090b" />
      <ellipse cx="33" cy="74" rx="4.2" ry="5.5" fill="#09090b" />
      <ellipse cx="32" cy="84" rx="4" ry="5.5" fill="#09090b" />
      <ellipse cx="31" cy="94" rx="3.5" ry="5.5" fill="#09090b" />
      <circle cx="30.5" cy="102" r="2.5" fill="#18181b" />
      {/* Elastic band */}
      <rect x="29" y="98" width="4" height="2" rx="0.5" fill="#a855f7" />
    </g>

    {/* Right Braid */}
    <g>
      <ellipse cx="86" cy="64" rx="4.5" ry="5.5" fill="#09090b" />
      <ellipse cx="87" cy="74" rx="4.2" ry="5.5" fill="#09090b" />
      <ellipse cx="88" cy="84" rx="4" ry="5.5" fill="#09090b" />
      <ellipse cx="89" cy="94" rx="3.5" ry="5.5" fill="#09090b" />
      <circle cx="89.5" cy="102" r="2.5" fill="#18181b" />
      {/* Elastic band */}
      <rect x="87" y="98" width="4" height="2" rx="0.5" fill="#a855f7" />
    </g>

    {/* Black Center-Parted Hair & Bangs */}
    <path
      d="M38 56C36 44 44 32 60 32C76 32 84 44 82 56C80 44 73 38 60 38C47 38 40 44 38 56Z"
      fill="#09090b"
    />
    {/* Bangs with clean straight edge */}
    <path
      d="M40 46C44 48 48 49 54 48L59 42L61 42L66 48C72 49 76 48 80 46C82 54 82 60 82 62C78 52 74 48 60 48C46 48 42 52 38 62C38 60 38 54 40 46Z"
      fill="#09090b"
    />

    {/* Stoic Dark Eyes with Under-eye subtle shadows */}
    <path d="M47 60C49 62 53 62 55 60" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.4" />
    <path d="M65 60C67 62 71 62 73 60" stroke="#7c3aed" strokeWidth="0.8" strokeOpacity="0.4" />

    <circle cx="51" cy="57" r="3" fill="#09090b" />
    <circle cx="69" cy="57" r="3" fill="#09090b" />
    <circle cx="50" cy="56" r="0.8" fill="#ffffff" />
    <circle cx="68" cy="56" r="0.8" fill="#ffffff" />

    {/* Sharp straight eyebrows */}
    <path d="M46 51L55 52" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
    <path d="M74 51L65 52" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />

    {/* Neutral / Stoic mouth line */}
    <path d="M55 67H65" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. Astronauta Avatar (Extra preset)
export const AstronautAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#0284c7" />
    <path d="M26 120C26 96 38 88 60 88C82 88 94 96 94 120H26Z" fill="#e2e8f0" />
    <circle cx="60" cy="56" r="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
    {/* Visor */}
    <ellipse cx="60" cy="56" rx="20" ry="16" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
    <path d="M46 50C52 46 68 46 74 50" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    <circle cx="52" cy="53" r="1.5" fill="#ffffff" />
  </svg>
);

// 6. Gato Ninja Avatar (Extra preset)
export const CatAvatar: React.FC<AvatarProps> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#f97316" />
    {/* Ears */}
    <path d="M40 45L34 26L52 38Z" fill="#ea580c" />
    <path d="M42 42L38 30L50 38Z" fill="#fecdd3" />
    <path d="M80 45L86 26L68 38Z" fill="#ea580c" />
    <path d="M78 42L82 30L70 38Z" fill="#fecdd3" />
    {/* Head */}
    <circle cx="60" cy="60" r="26" fill="#fdba74" />
    {/* Eyes */}
    <ellipse cx="50" cy="58" rx="4" ry="5" fill="#0f172a" />
    <ellipse cx="70" cy="58" rx="4" ry="5" fill="#0f172a" />
    <circle cx="51" cy="56" r="1.5" fill="#ffffff" />
    <circle cx="71" cy="56" r="1.5" fill="#ffffff" />
    {/* Nose & Mouth */}
    <polygon points="57,65 63,65 60,68" fill="#f43f5e" />
    <path d="M55 70C58 72 60 70 60 68C60 70 62 72 65 70" stroke="#0f172a" strokeWidth="1.5" fill="none" />
    {/* Whiskers */}
    <line x1="38" y1="64" x2="48" y2="65" stroke="#0f172a" strokeWidth="1.5" />
    <line x1="38" y1="70" x2="48" y2="68" stroke="#0f172a" strokeWidth="1.5" />
    <line x1="82" y1="64" x2="72" y2="65" stroke="#0f172a" strokeWidth="1.5" />
    <line x1="82" y1="70" x2="72" y2="68" stroke="#0f172a" strokeWidth="1.5" />
  </svg>
);

export const RenderProfileAvatar: React.FC<{
  avatarId: string;
  className?: string;
}> = ({ avatarId, className = 'w-full h-full' }) => {
  switch (avatarId) {
    case 'roberto':
      return <RobertoAvatar className={className} />;
    case 'elfo':
      return <ElfoAvatar className={className} />;
    case 'rainha':
      return <RainhaAvatar className={className} />;
    case 'wandinha':
      return <WandinhaAvatar className={className} />;
    case 'astronauta':
      return <AstronautAvatar className={className} />;
    case 'gato':
      return <CatAvatar className={className} />;
    default:
      return <RobertoAvatar className={className} />;
  }
};
