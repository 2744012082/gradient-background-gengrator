'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useGradientGenerator } from '@/hooks/useGradientGenerator';
import { colorPresets } from '@/lib/constants';
import { colorToParam } from '@/lib/utils';
import { Download, RefreshCw, Palette, Sparkles, Layers, Code, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';

export default function GradientGenerator() {
  const {
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
    updateColors
  } = useGradientGenerator();

  const [apiLinkCopied, setApiLinkCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    generateGradient();
  }, [generateGradient]);

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setColors(preset.colors);
  };

  const generateApiLink = () => {
    if (!mounted) return '';
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api`
      : '/api';
    const params = new URLSearchParams();
    colors.forEach(color => params.append('colors', colorToParam(color)));
    params.append('width', width.toString());
    params.append('height', height.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const copyApiLink = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        const apiLink = generateApiLink();
        await navigator.clipboard.writeText(apiLink);
        setApiLinkCopied(true);
        setTimeout(() => setApiLinkCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy API link:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2 animate-fade-in">
            <Palette className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
            Gradient Generator
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-sans max-w-2xl mx-auto leading-relaxed">
            Create stunning, randomized SVG gradients for your next project. 
            <span className="text-primary font-medium ml-1">Simple, fast, and open source.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-1.5 sm:p-2">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center border border-border/50">
                {svgContent ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    className="w-full h-full transform transition-transform duration-500 hover:scale-[1.01] [&>svg]:w-full [&>svg]:h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-muted border-t-primary"></div>
                    <span className="text-sm font-medium font-display">Generating...</span>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button 
                    onClick={generateGradient} 
                    disabled={isGenerating}
                    size="sm"
                    className="bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-foreground shadow-sm backdrop-blur-sm border border-black/5 dark:border-white/10"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               <Button 
                onClick={downloadGradient} 
                disabled={!svgContent}
                className="flex-1 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5 mr-2" />
                Download SVG
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-12 text-base font-medium border-2 hover:bg-muted/50"
                onClick={copyApiLink}
              >
                 <Code className="w-5 h-5 mr-2" />
                 {apiLinkCopied ? 'Link Copied!' : 'Copy API Link'}
              </Button>
            </div>

            {/* API Section */}
            <div className="bg-muted/30 rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 font-display text-lg font-semibold">
                <Zap className="w-5 h-5 text-chart-2" />
                <span>Developer API</span>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 font-mono text-xs sm:text-sm text-muted-foreground break-all shadow-sm">
                {generateApiLink() || 'Loading...'}
              </div>
               <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Hex colors required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                    <span>Auto-optimized</span>
                  </div>
                </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Dimensions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                 <Layers className="w-5 h-5 text-primary" />
                 <h2 className="font-display font-semibold text-lg">Dimensions</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Width</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Height</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-lg">Colors</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{colorMode === 'free' ? '自由模式' : '推荐模式'}</span>
                  <Switch 
                    checked={colorMode === 'recommended'}
                    onCheckedChange={(checked) => setColorMode(checked ? 'recommended' : 'free')}
                    className="w-10 h-5"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Color Wheel */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="wheel-color-picker">
                      <HexColorPicker 
                        color={colors[0]} 
                        onChange={(color) => {
                          if (colorMode === 'recommended') {
                            updateColors(color);
                          } else {
                            updateColors(color, colors[1]);
                          }
                        }} 
                      />
                    </div>
                    <Input
                      type="text"
                      value={colors[0].toUpperCase()}
                      onChange={(e) => {
                        if (colorMode === 'recommended') {
                          updateColors(e.target.value);
                        } else {
                          updateColors(e.target.value, colors[1]);
                        }
                      }}
                      className="mt-4 font-mono text-sm tracking-wider uppercase w-full max-w-xs"
                    />
                  </div>
                  
                  {colorMode === 'free' && (
                    <div className="flex flex-col items-center">
                      <div className="wheel-color-picker">
                        <HexColorPicker 
                          color={colors[1]} 
                          onChange={(color) => updateColors(colors[0], color)} 
                        />
                      </div>
                      <Input
                        type="text"
                        value={colors[1].toUpperCase()}
                        onChange={(e) => updateColors(colors[0], e.target.value)}
                        className="mt-4 font-mono text-sm tracking-wider uppercase w-full max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Presets */}
             <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                 <Sparkles className="w-5 h-5 text-primary" />
                 <h2 className="font-display font-semibold text-lg">Presets</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group relative overflow-hidden rounded-lg aspect-[3/2] border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div 
                      className="absolute inset-0" 
                      style={{ background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
