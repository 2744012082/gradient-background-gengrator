import { useState, useCallback } from 'react';
import { generateRandomSVG } from '@/lib/services/gradientGenerator';
import { colorToParam } from '@/lib/utils';

export type ColorMode = 'free' | 'recommended';

export function useGradientGenerator() {
  const [colors, setColors] = useState<string[]>(['#5135FF', '#FF5828']);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('free');

  const generateGradient = useCallback(async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      colors.forEach(color => params.append('colors', colorToParam(color)));
      params.append('width', width.toString());
      params.append('height', height.toString());
      const response = await fetch(`/api?${params.toString()}`);
      const svg = await response.text();
      setSvgContent(svg);
    } catch (error) {
      console.error('Error generating gradient:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [colors, width, height]);

  const downloadGradient = useCallback(() => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradient-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [svgContent]);

  const getComplementaryColor = useCallback((color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hsl = rgbToHsl(r, g, b);
    const complementaryHsl = [(hsl.h + 180) % 360, hsl.s, hsl.l];
    const complementaryRgb = hslToRgb(complementaryHsl[0], complementaryHsl[1], complementaryHsl[2]);
    
    return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
  }, []);

  const getTriadicColor = useCallback((color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hsl = rgbToHsl(r, g, b);
    const triadicHsl = [(hsl.h + 120) % 360, Math.min(hsl.s + 10, 100), hsl.l];
    const triadicRgb = hslToRgb(triadicHsl[0], triadicHsl[1], triadicHsl[2]);
    
    return rgbToHex(triadicRgb.r, triadicRgb.g, triadicRgb.b);
  }, []);

  const getAnalogousColor = useCallback((color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hsl = rgbToHsl(r, g, b);
    const analogousHsl = [(hsl.h + 30) % 360, hsl.s, Math.min(hsl.l + 15, 85)];
    const analogousRgb = hslToRgb(analogousHsl[0], analogousHsl[1], analogousHsl[2]);
    
    return rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b);
  }, []);

  const getRecommendedColor = useCallback((color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const hsl = rgbToHsl(r, g, b);
    
    let recommendedHsl: { h: number; s: number; l: number };
    
    if (hsl.l < 30) {
      recommendedHsl = [(hsl.h + 180) % 360, Math.min(hsl.s + 20, 100), Math.min(hsl.l + 50, 80)];
    } else if (hsl.l > 70) {
      recommendedHsl = [(hsl.h + 180) % 360, Math.min(hsl.s + 20, 100), Math.max(hsl.l - 40, 25)];
    } else {
      recommendedHsl = [(hsl.h + 180) % 360, hsl.s, 100 - hsl.l];
    }
    
    const recommendedRgb = hslToRgb(recommendedHsl.h, recommendedHsl.s, recommendedHsl.l);
    
    return rgbToHex(recommendedRgb.r, recommendedRgb.g, recommendedRgb.b);
  }, []);

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
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
      r = hue2rgb(p, q, h / 360 + 1/3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1/3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  };

  const updateColors = useCallback((primaryColor: string, secondaryColor?: string) => {
    if (colorMode === 'recommended') {
      const recommended = getRecommendedColor(primaryColor);
      setColors([primaryColor, recommended]);
    } else {
      if (secondaryColor) {
        setColors([primaryColor, secondaryColor]);
      }
    }
  }, [colorMode, getRecommendedColor]);

  return {
    colors,
    setColors,
    width,
    setWidth,
    height,
    setHeight,
    svgContent,
    isGenerating,
    generateGradient,
    downloadGradient,
    colorMode,
    setColorMode,
    updateColors,
    getRecommendedColor
  };
}