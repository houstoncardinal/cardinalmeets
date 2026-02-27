import { useEffect, useState } from "react";
import { Reaction } from "@/hooks/useReactions";

interface ReactionsOverlayProps {
  reactions: Reaction[];
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  startTime: number;
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    const newReaction: FloatingReaction = {
      id: latest.id,
      emoji: latest.reaction,
      x: 20 + Math.random() * 60,
      startTime: Date.now(),
    };
    setFloating((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setFloating((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  }, [reactions]);

  if (floating.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floating.map((r) => (
        <div
          key={r.id}
          className="absolute animate-bounce text-3xl"
          style={{
            left: `${r.x}%`,
            bottom: "120px",
            animation: "float-up 3s ease-out forwards",
          }}
        >
          {r.emoji}
        </div>
      ))}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
