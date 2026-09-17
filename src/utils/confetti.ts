import confetti from "canvas-confetti";

export const triggerDealWonConfetti = () => {
  try {
    // 1. Center big burst with rich brand colors (emerald, cyan, gold, indigo)
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#06b6d4", "#f59e0b", "#6366f1", "#34d399", "#38bdf8"],
      ticks: 250,
      zIndex: 99999,
    });

    // 2. Left and right fireworks cannons
    const end = Date.now() + 1500;
    const colors = ["#10b981", "#22d3ee", "#fbbf24", "#a855f7"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
        zIndex: 99999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
        zIndex: 99999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  } catch (err) {
    console.error("Confetti trigger error:", err);
  }
};
