import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = '',
  delay = 0.2 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0, x: position === 'left' ? 5 : position === 'right' ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-800 border border-slate-700 rounded-lg shadow-xl whitespace-nowrap \${positionStyles[position]} \${className}`}
            style={{ pointerEvents: 'none' }}
          >
            {content}
            <div 
              className={`absolute border-[5px] \${arrowStyles[position]}`} 
              style={{ width: 0, height: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
