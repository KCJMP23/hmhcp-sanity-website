'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VisitorLocation {
  country: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
}

interface VisitorMapProps {
  visitors: VisitorLocation[];
}

export function VisitorMap({ visitors }: VisitorMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw world map outline (simplified)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;

    // Draw continents (simplified representation)
    drawContinent(ctx, canvas.width * 0.45, canvas.height * 0.25, 80, 60); // Europe
    drawContinent(ctx, canvas.width * 0.5, canvas.height * 0.45, 100, 80); // Africa
    drawContinent(ctx, canvas.width * 0.65, canvas.height * 0.35, 120, 100); // Asia
    drawContinent(ctx, canvas.width * 0.2, canvas.height * 0.35, 100, 80); // North America
    drawContinent(ctx, canvas.width * 0.25, canvas.height * 0.65, 80, 60); // South America
    drawContinent(ctx, canvas.width * 0.75, canvas.height * 0.7, 80, 40); // Australia

    // Draw visitor locations
    visitors.forEach(visitor => {
      const x = ((visitor.lng + 180) / 360) * canvas.width;
      const y = ((90 - visitor.lat) / 180) * canvas.height;
      
      // Draw glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, visitor.count * 3 + 10);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, visitor.count * 3 + 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw center dot
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw visitor count
      if (visitor.count > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(visitor.count.toString(), x, y - 10);
      }
    });

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([5, 5]);
    
    // Latitude lines
    for (let i = 0; i <= 180; i += 30) {
      const y = (i / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 0; i <= 360; i += 60) {
      const x = (i / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  }, [visitors]);

  function drawContinent(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  return (
    <div className="relative w-full h-64">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      {visitors.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No active visitors</p>
        </div>
      )}
    </div>
  );
}