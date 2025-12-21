import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * ConfidenceMeter - Semi-circle gauge showing algorithm confidence
 * Confidence = difference between highest and second-highest probability
 */
const ConfidenceMeter = ({ prediction }) => {
  const { homeWin, draw, awayWin } = prediction;

  // Calculate confidence
  const confidence = useMemo(() => {
    const probs = [homeWin, draw, awayWin].sort((a, b) => b - a);
    const highest = probs[0];
    const secondHighest = probs[1];
    const gap = highest - secondHighest;

    // Normalize to 0-100 scale
    const normalized = Math.min(100, (gap / 50) * 100); // Gap of 50% = 100% confidence

    let level = 'LOW';
    let color = '#fbbf24'; // yellow
    let description = 'Uncertain outcome';

    if (normalized >= 70) {
      level = 'VERY HIGH';
      color = '#10b981'; // emerald
      description = 'Clear prediction';
    } else if (normalized >= 50) {
      level = 'HIGH';
      color = '#22c55e'; // green
      description = 'Strong confidence';
    } else if (normalized >= 30) {
      level = 'MEDIUM';
      color = '#f59e0b'; // amber
      description = 'Moderate confidence';
    }

    return {
      value: normalized,
      gap: gap.toFixed(1),
      level,
      color,
      description
    };
  }, [homeWin, draw, awayWin]);

  // Calculate arc path
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const progress = (confidence.value / 100) * circumference;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-neon-teal font-mono text-center">
        [CONFIDENCE METER]
      </h3>

      <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
        <div className="flex flex-col items-center">
          {/* SVG Gauge */}
          <div className="relative" style={{ width: radius * 2 + 40, height: radius + 40 }}>
            <svg
              width={radius * 2 + 40}
              height={radius + 40}
              className="transform -rotate-90"
            >
              {/* Background arc */}
              <path
                d={describeArc(radius + 20, radius + 20, radius, -180, 0)}
                fill="none"
                stroke="rgba(75, 85, 99, 0.3)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Progress arc */}
              <motion.path
                d={describeArc(radius + 20, radius + 20, radius, -180, 0)}
                fill="none"
                stroke={confidence.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - progress }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  filter: `drop-shadow(0 0 8px ${confidence.color})`
                }}
              />

              {/* Glow effect */}
              <motion.path
                d={describeArc(radius + 20, radius + 20, radius, -180, 0)}
                fill="none"
                stroke={confidence.color}
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference - progress}
                opacity={0.3}
                style={{
                  filter: `blur(8px)`
                }}
              />
            </svg>

            {/* Center content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ top: '30%' }}
            >
              <div className="text-4xl font-bold font-mono" style={{ color: confidence.color }}>
                {Math.round(confidence.value)}%
              </div>
              <div className="text-xs text-gray-400 font-mono mt-1">
                CONFIDENCE
              </div>
            </motion.div>
          </div>

          {/* Labels */}
          <div className="flex justify-between w-full px-4 mt-2">
            <span className="text-xs text-gray-500 font-mono">LOW</span>
            <span className="text-xs text-gray-500 font-mono">MEDIUM</span>
            <span className="text-xs text-gray-500 font-mono">HIGH</span>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 w-full bg-cyber-dark/50 rounded-lg p-4 border border-gray-700/50"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 font-mono">LEVEL</div>
                <div className="text-sm font-bold font-mono" style={{ color: confidence.color }}>
                  {confidence.level}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-mono">GAP</div>
                <div className="text-sm font-bold text-white font-mono">
                  {confidence.gap}%
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700/50">
              <div className="text-xs text-gray-400 font-mono">{confidence.description}</div>
            </div>
          </motion.div>

          {/* Explanation */}
          <div className="mt-4 text-xs text-gray-500 font-mono text-center leading-relaxed">
            Confidence measures how certain the model is about its prediction.
            <br />
            Higher confidence = clearer outcome expected.
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Describe an arc for SVG path
 */
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
};

/**
 * Convert polar coordinates to cartesian
 */
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

export default ConfidenceMeter;
