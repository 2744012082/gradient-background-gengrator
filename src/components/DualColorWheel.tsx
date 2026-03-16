'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DualColorWheelProps {
  color1: string;
  color2: string;
  onChange: (color1: string, color2: string) => void;
  mode: 'free' | 'recommended';
  getRecommendedColor?: (color: string) => string;
}

export function DualColorWheel({
  color1,
  color2,
  onChange,
  mode,
  getRecommendedColor
}: DualColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<1 | 2 | null>(null);
  const [activeColor, setActiveColor] = useState<1 | 2>(1);
  const wheelSize = 240;
  const center = wheelSize / 2;
  const radius = wheelSize / 2 - 10;

  const recommendedColor = mode === 'recommended' && getRecommendedColor ? getRecommendedColor(color1) : color2;
  const displayColor2 = mode === 'recommended' ? recommendedColor : color2;

  const hexToHsl = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 50, l: 50 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }, []);

  const hslToHex = useCallback((h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }, []);

  const getColorFromPosition = useCallback((x: number, y: number) => {
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let angle = Math.atan2(dy, dx);
    let h = ((angle * 180 / Math.PI) + 360) % 360;
    
    let s = Math.min(distance / radius, 1) * 100;
    const l = 50;
    
    return hslToHex(h, s, l);
  }, [center, radius, hslToHex]);

  const getPositionFromColor = useCallback((hex: string) => {
    const { h, s } = hexToHsl(hex);
    const angle = (h * Math.PI) / 180;
    const distance = (s / 100) * radius;
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;
    return { x, y };
  }, [center, radius, hexToHsl]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, `hsl(${angle}, 0%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 50%, 50%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.globalCompositeOperation = 'source-over';
  }, [center, radius, wheelSize]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWheel();

    const pos1 = getPositionFromColor(color1);
    const pos2 = getPositionFromColor(displayColor2);

    ctx.globalCompositeOperation = 'source-over';
    
    ctx.beginPath();
    ctx.arc(pos1.x, pos1.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = activeColor === 1 ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = activeColor === 1 ? 3 : 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos1.x, pos1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color1;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos2.x, pos2.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = activeColor === 2 ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = activeColor === 2 ? 3 : 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos2.x, pos2.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = displayColor2;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

  }, [color1, displayColor2, activeColor, drawWheel, getPositionFromColor, getRecommendedColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pos1 = getPositionFromColor(color1);
    const pos2 = getPositionFromColor(displayColor2);

    const dist1 = Math.sqrt((x - pos1.x) ** 2 + (y - pos1.y) ** 2);
    const dist2 = Math.sqrt((x - pos2.x) ** 2 + (y - pos2.y) ** 2);

    if (mode === 'recommended') {
      setActiveColor(1);
      const newColor = getColorFromPosition(x, y);
      const recommended = getRecommendedColor ? getRecommendedColor(newColor) : newColor;
      onChange(newColor, recommended);
    } else {
      if (dist1 < 20) {
        setIsDragging(1);
        setActiveColor(1);
      } else if (dist2 < 20) {
        setIsDragging(2);
        setActiveColor(2);
      } else {
        const newColor = getColorFromPosition(x, y);
        onChange(newColor, displayColor2);
        setActiveColor(1);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || mode === 'recommended') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > radius) {
      const angle = Math.atan2(dy, dx);
      const constrainedX = center + Math.cos(angle) * radius;
      const constrainedY = center + Math.sin(angle) * radius;
      const newColor = getColorFromPosition(constrainedX, constrainedY);
      
      if (isDragging === 1) {
        onChange(newColor, displayColor2);
      } else {
        onChange(color1, newColor);
      }
    } else {
      const newColor = getColorFromPosition(x, y);
      if (isDragging === 1) {
        onChange(newColor, displayColor2);
      } else {
        onChange(color1, newColor);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(null);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const handleColorClick = (colorNum: 1 | 2) => {
    if (mode === 'recommended') return;
    setActiveColor(colorNum);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={wheelSize}
          height={wheelSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="cursor-crosshair rounded-full shadow-lg"
          style={{ width: wheelSize, height: wheelSize }}
        />
      </div>

      <div className="flex gap-4 items-center justify-center">
        <button
          onClick={() => handleColorClick(1)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            activeColor === 1 
              ? "border-primary bg-primary/10 shadow-md" 
              : "border-border hover:border-primary/50",
            mode === 'recommended' && "cursor-not-allowed opacity-70"
          )}
          disabled={mode === 'recommended'}
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: color1 }}
          />
          <span className="font-mono text-sm uppercase">{color1}</span>
        </button>

        <button
          onClick={() => handleColorClick(2)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
            activeColor === 2 
              ? "border-primary bg-primary/10 shadow-md" 
              : "border-border hover:border-primary/50",
            mode === 'recommended' && "cursor-not-allowed opacity-70"
          )}
          disabled={mode === 'recommended'}
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: displayColor2 }}
          />
          <span className="font-mono text-sm uppercase">{displayColor2}</span>
        </button>
      </div>

      <div className="flex gap-2 items-center justify-center mt-2">
        <div 
          className="w-16 h-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color1}, ${displayColor2})` }}
        />
      </div>

      {mode === 'recommended' && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>推荐颜色</span>
        </div>
      )}
    </div>
  );
}
