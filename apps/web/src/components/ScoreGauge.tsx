"use client";

import { motion } from "framer-motion";
import { scoreTone } from "@/lib/risk-tone";

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const dashOffset = CIRC - (CIRC * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div
      className="relative"
      style={{ width: SIZE, height: SIZE }}
      aria-label={`Скор риска ${score} из 100`}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#26262e"
          strokeWidth={STROKE}
          fill="transparent"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={tone.color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${tone.color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-5xl font-bold tracking-tight text-ink"
          style={{ color: tone.color }}
        >
          {score}
        </motion.div>
        <div className="text-xs uppercase tracking-wider text-ink-dim">
          из 100
        </div>
      </div>
    </div>
  );
}

