import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { usePrivacy } from '../contexts/PrivacyContext';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, className }) => {
  const { isPrivacyMode, formatValue } = usePrivacy();
  const [displayValue, setDisplayValue] = useState(formatValue(value));
  const [isPulseActive, setIsPulseActive] = useState(false);
  
  const count = useMotionValue(0);

  useEffect(() => {
    if (isPrivacyMode) {
      setDisplayValue('R$ ****');
      return;
    }

    setIsPulseActive(true);
    count.set(0); // Always start from 0 on update as requested
    
    const controls = animate(count, value, {
      duration: 1.5, // slightly longer for dramatic effect
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(latest));
      },
      onComplete: () => {
        setIsPulseActive(false);
        setDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value));
      }
    });

    return controls.stop;
  }, [value, isPrivacyMode, count]);

  return (
    <motion.span 
      className={`${className} ${isPulseActive ? 'animate-pulse drop-shadow-[0_0_8px_currentColor]' : ''}`}
    >
      {displayValue}
    </motion.span>
  );
};
