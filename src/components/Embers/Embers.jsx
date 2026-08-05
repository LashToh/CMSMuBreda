import { useEffect, useRef } from 'react';
import './Embers.scss';

const EMBER_COUNT = 60;

export default function Embers({ className = '', intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let embers = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createEmber = () => ({
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + Math.random() * 50,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 30 + 0,
      life: Math.random() * 200 + 100,
      age: 0,
    });

    const init = () => {
      embers = Array.from({ length: EMBER_COUNT * intensity }, createEmber);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      embers.forEach((ember, i) => {
        ember.age++;
        ember.y -= ember.speedY;
        ember.x += ember.speedX + Math.sin(ember.age * 0.05) * 0.3;

        const lifeRatio = 1 - ember.age / ember.life;
        if (lifeRatio <= 0) {
          embers[i] = createEmber();
          embers[i].y = canvas.offsetHeight + 10;
          return;
        }

        const alpha = ember.opacity * lifeRatio;
        const gradient = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, ember.size * 3
        );
        gradient.addColorStop(0, `hsla(${ember.hue + 15}, 100%, 60%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${ember.hue}, 90%, 45%, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={`embers ${className}`} aria-hidden="true" />;
}
