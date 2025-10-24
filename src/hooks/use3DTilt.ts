/**
 * use3DTilt Hook
 * 
 * Creates smooth 3D tilt effect that follows mouse movement
 */

import { useRef, useState } from 'react';
import { useSpring } from 'framer-motion';

export function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateX = (e.clientY - centerY) / 25;
    const rotateY = (centerX - e.clientX) / 25;

    x.set(rotateX);
    y.set(rotateY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return {
    ref,
    isHovered,
    style: {
      transform: `perspective(1000px) rotateX(${x.get()}deg) rotateY(${y.get()}deg)`,
      transformStyle: 'preserve-3d' as const,
    },
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onMouseEnter: handleMouseEnter,
    },
    x,
    y,
  };
}
