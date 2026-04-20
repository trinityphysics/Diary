import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  r: number;
  g: number;
  b: number;
}

function makeStar(bright: boolean): Star {
  // Colour palette: white, lavender, soft-cyan
  const palette = [
    [220, 210, 255],
    [200, 220, 255],
    [255, 240, 255],
    [150, 200, 255],
  ];
  const col = palette[Math.floor(Math.random() * palette.length)];
  return {
    x: Math.random(),
    y: Math.random(),
    size: bright
      ? Math.random() * 2.2 + 1.4
      : Math.random() * 1.4 + 0.3,
    opacity: bright
      ? Math.random() * 0.4 + 0.55
      : Math.random() * 0.55 + 0.15,
    twinkleSpeed: Math.random() * 0.018 + 0.004,
    twinkleOffset: Math.random() * Math.PI * 2,
    r: col[0],
    g: col[1],
    b: col[2],
  };
}

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const stars: Star[] = Array.from({ length: 160 }, () => makeStar(false));
    const brightStars: Star[] = Array.from({ length: 18 }, () => makeStar(true));

    const drawStar = (star: Star) => {
      const x = star.x * canvas.width;
      const y = star.y * canvas.height;
      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset);
      const alpha = star.opacity * (0.35 + 0.65 * twinkle);
      const { r, g, b } = star;

      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.fill();

      if (star.size > 1.2) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, star.size * 5);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.25).toFixed(3)})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, star.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    };

    const loop = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(drawStar);
      brightStars.forEach(drawStar);
      animId = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => setSize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-field" aria-hidden="true" />;
};

export default StarField;
