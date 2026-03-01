import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Colors from '@/constants/colors';

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // Show P
      setTimeout(() => setPhase(2), 1000),  // Show PALLY
      setTimeout(() => setPhase(3), 1800),  // Show tagline
      setTimeout(() => setPhase(4), 3000),  // Fade out
      setTimeout(() => onComplete(), 3600), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: Colors.dark.background }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={phase >= 1 ? { scale: 1, rotate: 0 } : {}}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <motion.div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: Colors.dark.accent }}
                animate={phase >= 1 ? {
                  boxShadow: [
                    `0 0 0 rgba(191, 255, 0, 0)`,
                    `0 0 60px rgba(191, 255, 0, 0.5)`,
                    `0 0 30px rgba(191, 255, 0, 0.3)`,
                  ],
                } : {}}
                transition={{ duration: 1, times: [0, 0.5, 1] }}
              >
                <span
                  className="text-5xl font-black"
                  style={{ color: '#000' }}
                >
                  P
                </span>
              </motion.div>
            </motion.div>

            {/* Text */}
            <div className="overflow-hidden">
              <motion.h1
                className="text-4xl font-bold tracking-tight"
                style={{ color: Colors.dark.text }}
                initial={{ y: 60, opacity: 0 }}
                animate={phase >= 2 ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                PALLY
              </motion.h1>
            </div>

            {/* Tagline */}
            <motion.p
              className="mt-4 text-lg"
              style={{ color: Colors.dark.textSecondary }}
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              Predict. Compete. Win.
            </motion.p>

            {/* Loading dots */}
            <motion.div
              className="flex gap-2 mt-12"
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : {}}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: Colors.dark.accent }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Background effects */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
          >
            {/* Radial gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${Colors.dark.accentDim} 0%, transparent 70%)`,
              }}
            />

            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke={Colors.dark.accent}
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <motion.rect
                width="100%"
                height="100%"
                fill="url(#grid)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
