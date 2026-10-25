import React, { useState } from 'react';
import { PetCharacter, PetMood } from '../store/useTaskStore';

interface PetAvatarProps {
  pet: PetCharacter;
  mood: PetMood;
  size?: 'sm' | 'md' | 'lg';
  isEating?: boolean;
  isResting?: boolean;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  pet,
  mood,
  size = 'lg',
  isEating = false,
  isResting = false,
}) => {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const imageMap: Record<string, string> = {
    'olaf-happy': './pets/olaf-happy.png',
    'olaf-grumpy': './pets/olaf-grumpy.png',
    'lana-sassy': './pets/lana-sassy.png',
    'lana-fierce': './pets/lana-fierce.png',
    'olania-sleeping': './pets/olania-sleeping.png',
  };

  const key = isResting
    ? 'olania-sleeping'
    : pet === 'olaf'
    ? mood === 'grumpy' || mood === 'fierce'
      ? 'olaf-grumpy'
      : 'olaf-happy'
    : mood === 'fierce' || mood === 'grumpy'
    ? 'lana-fierce'
    : 'lana-sassy';

  const imgSrc = imageMap[key];

  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  const isAngry = !isResting && (mood === 'grumpy' || mood === 'fierce');

  return (
    <div
      className={`relative rounded-full flex items-center justify-center transition-all duration-500 select-none ${sizeClasses} ${
        isResting
          ? 'ring-4 ring-indigo-200/90 shadow-lg shadow-indigo-200/50 opacity-95'
          : isEating
          ? 'scale-110 ring-4 ring-violet-400 animate-wiggle'
          : isAngry
          ? 'ring-4 ring-rose-400/80 shadow-lg shadow-rose-200 animate-wiggle'
          : 'ring-4 ring-white shadow-xl shadow-stone-300/70 animate-float'
      }`}
      style={{
        background: isResting
          ? 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)'
          : pet === 'olaf'
          ? isAngry
            ? 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)'
          : isAngry
          ? 'linear-gradient(135deg, #ffe4e6 0%, #fed7aa 100%)'
          : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      }}
    >
      {/* Burbujitas Zzz flotantes cuando están durmiendo */}
      {isResting && (
        <div className="absolute -top-2 -right-1 bg-indigo-900/90 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
          Zzz 🌙
        </div>
      )}

      {!imgError[key] ? (
        <img
          src={imgSrc}
          alt={isResting ? 'Olaf y Lana durmiendo juntos' : pet === 'olaf' ? 'Olaf' : 'Lana'}
          onError={() => setImgError((prev) => ({ ...prev, [key]: true }))}
          style={{ imageRendering: 'pixelated' }}
          className="w-full h-full object-cover rounded-full"
        />
      ) : isResting ? (
        /* SVG de respaldo: Olaf y Lana durmiendo acurrucados juntos */
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
          {/* Olaf a la izquierda durmiendo */}
          <circle cx="38" cy="58" r="22" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M35 36 Q38 24 43 35" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M29 55 Q33 59 37 55" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M41 55 Q45 59 49 55" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="39" cy="61" rx="3.5" ry="2.5" fill="#1e293b" />
          {/* Lana a la derecha acurrucada con Olaf */}
          <polygon points="55,46 52,26 67,38" fill="#8b7355" />
          <polygon points="83,46 86,26 71,38" fill="#8b7355" />
          <circle cx="67" cy="60" r="20" fill="#9c8265" stroke="#5c4938" strokeWidth="2" />
          <path d="M59 57 Q63 61 67 57" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M69 57 Q73 61 77 57" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ) : pet === 'olaf' ? (
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
          <ellipse cx="22" cy="54" rx="14" ry="22" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
          <ellipse cx="78" cy="54" rx="14" ry="22" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
          <circle cx="50" cy="54" r="30" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
          <path d="M46 25 Q50 8 56 22 Q52 14 48 25" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          <circle cx="39" cy="49" r="4.5" fill="#1f2937" />
          <circle cx="61" cy="49" r="4.5" fill="#1f2937" />
          <ellipse cx="50" cy="57" rx="5.5" ry="4" fill="#1f2937" />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
          <polygon points="22,45 18,16 42,32" fill="#8b7355" stroke="#5c4938" strokeWidth="2" />
          <polygon points="78,45 82,16 58,32" fill="#8b7355" stroke="#5c4938" strokeWidth="2" />
          <circle cx="50" cy="56" r="29" fill="#9c8265" stroke="#5c4938" strokeWidth="2" />
          <ellipse cx="50" cy="64" rx="14" ry="10" fill="#faf5ef" />
          <circle cx="38" cy="53" r="6.5" fill="#111827" />
          <circle cx="62" cy="53" r="6.5" fill="#111827" />
        </svg>
      )}

      {/* Etiqueta flotante del nombre e indicador de estado */}
      <span
        className={`absolute -bottom-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border whitespace-nowrap ${
          isResting
            ? 'bg-indigo-950 text-indigo-100 border-indigo-800'
            : pet === 'olaf'
            ? isAngry
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-white text-stone-800 border-stone-200'
            : isAngry
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-amber-900 text-amber-50 border-amber-800'
        }`}
      >
        {isResting
          ? '💤 Descansando'
          : pet === 'olaf'
          ? isAngry
            ? '🐶 Olaf 💢'
            : '🐶 Olaf'
          : isAngry
          ? '🐱 Lana 🔥'
          : '🐱 Lana'}
      </span>
    </div>
  );
};
