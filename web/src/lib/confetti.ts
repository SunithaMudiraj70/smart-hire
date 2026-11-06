import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  // Vibrant multi-color particle blast
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
  });
};

export const triggerStageCelebration = () => {
  // High-energy milestone celebration fireworks
  const count = 180;
  const defaults = {
    origin: { y: 0.65 }
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  };

  fire(0.25, {
    spread: 30,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

