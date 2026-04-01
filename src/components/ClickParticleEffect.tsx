import { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: string;
  velocityX: number;
  velocityY: number;
  scale: number;
  opacity: number;
}

interface ParticleDotProps {
  particle: Particle;
  onComplete: (id: number) => void;
}

const ParticleDot = ({ particle, onComplete }: ParticleDotProps) => {
  const [position, setPosition] = useState({ x: particle.x, y: particle.y });
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(particle.rotation);

  useEffect(() => {
    let frame = 0;
    const maxFrames = 60;
    let velX = particle.velocityX;
    let velY = particle.velocityY;

    const animate = () => {
      frame++;
      const progress = frame / maxFrames;

      // Gravity effect
      velY += 0.3;
      
      // Friction
      velX *= 0.98;

      const newX = particle.x + velX * frame;
      const newY = particle.y + velY * frame;
      const newOpacity = Math.max(0, 1 - progress);
      const newScale = 1 + progress * 0.5;
      const newRotation = particle.rotation + progress * 360;

      setPosition({ x: newX, y: newY });
      setOpacity(newOpacity);
      setScale(newScale);
      setRotation(newRotation);

      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete(particle.id);
      }
    };

    requestAnimationFrame(animate);
  }, [particle]);

  const getColorStyle = (): { background: string; boxShadow?: string } => {
    switch (particle.shape) {
      case 'pepper':
        return {
          background: `radial-gradient(ellipse at 30% 30%, ${particle.color}, #1a1a1a)`,
          boxShadow: `0 0 ${particle.size}px ${particle.color}40`
        };
      case 'cinnamon':
        return {
          background: `linear-gradient(135deg, ${particle.color}, #8B4513)`
        };
      case 'turmeric':
        return {
          background: `radial-gradient(circle, ${particle.color}, #D4880F)`
        };
      case 'paprika':
        return {
          background: `linear-gradient(45deg, ${particle.color}, #C41E3A)`
        };
      case 'clove':
        return {
          background: `radial-gradient(ellipse at center, ${particle.color}, #4A1C0F)`
        };
      default:
        return { background: particle.color };
    }
  };

  const getShapeStyle = () => {
    switch (particle.shape) {
      case 'pepper':
        return { borderRadius: '50% 50% 45% 45%' };
      case 'cinnamon':
        return { borderRadius: '40% 60% 60% 40%', padding: '2px' };
      case 'turmeric':
        return { borderRadius: '45% 55% 50% 50%' };
      case 'paprika':
        return { borderRadius: '50% 40% 60% 45%' };
      case 'clove':
        return { borderRadius: '45% 45% 50% 50%' };
      default:
        return { borderRadius: '50%' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x - particle.size / 2,
        top: position.y - particle.size / 2,
        width: particle.size * scale,
        height: particle.size * scale * 1.2,
        ...getColorStyle(),
        ...getShapeStyle(),
        opacity,
        transform: `rotate(${rotation}deg)`,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform, opacity'
      }}
    />
  );
};

const shapes = ['pepper', 'cinnamon', 'turmeric', 'paprika', 'clove'];
const spiceColors = [
  '#8B0000', // Dark red (paprika)
  '#D4880F', // Turmeric yellow
  '#4A1C0F', // Dark brown (clove)
  '#C41E3A', // Red (chili)
  '#8B4513', // Cinnamon
  '#B8860B', // Golden rod
  '#A0522D', // Sienna
  '#CD853F', // Peru
  '#D2691E', // Chocolate
  '#2F1B14', // Very dark brown (black pepper)
  '#1C1C1C', // Almost black
  '#800020', // Burgundy
];

const ClickParticleEffect: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    // Don't trigger animation on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    setClickPos({ x: e.clientX, y: e.clientY });

    const newParticles: Particle[] = [];
    const particleCount = 20 + Math.floor(Math.random() * 15);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const velocity = 2 + Math.random() * 4;
      const color = spiceColors[Math.floor(Math.random() * spiceColors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = 2 + Math.random() * 3;

      newParticles.push({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
        color,
        size,
        rotation: Math.random() * 360,
        shape,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 2,
        scale: 1,
        opacity: 1,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const handleParticleComplete = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [handleClick]);

  return (
    <>
      {particles.map(particle => (
        <ParticleDot
          key={particle.id}
          particle={particle}
          onComplete={handleParticleComplete}
        />
      ))}
      {/* Subtle pulse effect at click position */}
      {clickPos && (
        <div
          className="animate-ping"
          style={{
            position: 'fixed',
            left: clickPos.x - 3,
            top: clickPos.y - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 69, 19, 0.6), transparent)',
            pointerEvents: 'none',
            zIndex: 9998,
            animation: 'ping-once 0.6s ease-out forwards',
          }}
        />
      )}
      <style>{`
        @keyframes ping-once {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(6);
            opacity: 0;
          }
        }
        @keyframes particle-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ClickParticleEffect;