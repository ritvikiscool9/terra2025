// Confetti animation component
import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  config?: {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    scalar?: number;
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  decay: number;
  gravity: number;
  colors: string;
  tiltAngle: number;
  tiltAngleIncrement: number;
  life: number;
  scale: number;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  active, 
  config = {
    particleCount: 100,
    spread: 70,
    startVelocity: 45,
    decay: 0.9,
    scalar: 1
  }
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationId, setAnimationId] = useState<number | null>(null);

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const createParticle = (x: number, y: number): Particle => {
    const angle = (Math.random() * config.spread! - config.spread! / 2) * (Math.PI / 180);
    const velocity = Math.random() * config.startVelocity! + config.startVelocity! / 2;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      decay: config.decay!,
      gravity: 0.3,
      colors: colors[Math.floor(Math.random() * colors.length)],
      tiltAngle: Math.random() * 360,
      tiltAngleIncrement: Math.random() * 10 - 5,
      life: 1,
      scale: Math.random() * config.scalar! + 0.5
    };
  };

  const createConfetti = () => {
    const newParticles: Particle[] = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;

    for (let i = 0; i < config.particleCount!; i++) {
      newParticles.push(createParticle(centerX, centerY));
    }

    setParticles(newParticles);
  };

  const updateParticles = () => {
    setParticles(currentParticles => {
      const updated = currentParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * particle.decay,
          vy: particle.vy * particle.decay + particle.gravity,
          tiltAngle: particle.tiltAngle + particle.tiltAngleIncrement,
          life: particle.life - 0.02
        }))
        .filter(particle => particle.life > 0 && particle.y < window.innerHeight);

      if (updated.length === 0) {
        return [];
      }

      return updated;
    });
  };

  useEffect(() => {
    if (active) {
      createConfetti();
    } else {
      setParticles([]);
    }
  }, [active]);

  useEffect(() => {
    if (particles.length > 0) {
      const id = requestAnimationFrame(() => {
        updateParticles();
        setAnimationId(requestAnimationFrame(arguments.callee));
      });
      setAnimationId(id);
    } else if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particles]);

  if (!active || particles.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {particles.map((particle, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: 10 * particle.scale,
            height: 10 * particle.scale,
            backgroundColor: particle.colors,
            transform: `rotate(${particle.tiltAngle}deg)`,
            opacity: particle.life,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
