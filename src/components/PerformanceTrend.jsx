import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * Performance Trend Sparkline
 *
 * Displays a mini line chart showing team performance trajectory over last 5 games
 * - Trending up: Recent wins improving
 * - Trending down: Form declining
 * - Flat: Consistent performance
 */
const PerformanceTrend = ({ form, teamName, color = 'teal' }) => {
  if (!form || form.length === 0) {
    return null;
  }

  // Convert form string to point values
  const formData = parseFormToTrendData(form);
  const trend = calculateTrend(formData);
  const trendIcon = trend > 0.3 ? '📈' : trend < -0.3 ? '📉' : '📊';
  const trendText = trend > 0.3 ? 'Improving' : trend < -0.3 ? 'Declining' : 'Stable';
  const trendColor = trend > 0.3 ? 'text-green-400' : trend < -0.3 ? 'text-red-400' : 'text-yellow-400';

  const lineColor = color === 'teal' ? '#00f0ff' : '#ff00ff';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-cyber-dark border border-neon-teal/50 rounded px-2 py-1">
          <p className="text-xs font-mono text-gray-300">
            Game {dataPoint.game}: {dataPoint.result}
          </p>
          <p className="text-xs font-mono font-bold" style={{ color: lineColor }}>
            {dataPoint.points} pts
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      {/* Sparkline Chart */}
      <div className="flex-shrink-0" style={{ width: 80, height: 30 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formData}>
            <Line
              type="monotone"
              dataKey="points"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Indicator */}
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-base">{trendIcon}</span>
          <span className={`text-xs font-mono font-bold ${trendColor}`}>
            {trendText}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-mono">
          Last 5: {form}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Parse form string to trend data
 * W = 3 points, D = 1 point, L = 0 points
 */
const parseFormToTrendData = (form) => {
  const results = form.split('');
  return results.map((result, index) => {
    let points = 0;
    if (result === 'W') points = 3;
    else if (result === 'D') points = 1;

    return {
      game: index + 1,
      result: result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss',
      points,
      letter: result
    };
  });
};

/**
 * Calculate trend coefficient
 * Positive = improving, Negative = declining, ~0 = stable
 */
const calculateTrend = (formData) => {
  if (formData.length < 2) return 0;

  // Simple linear regression
  const n = formData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  formData.forEach((point, index) => {
    const x = index + 1;
    const y = point.points;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
};

/**
 * Form Badges Row
 * Visual representation of last 5 results with W/D/L badges
 */
export const FormBadges = ({ form, color = 'teal' }) => {
  if (!form) return null;

  const results = form.split('');

  return (
    <div className="flex gap-1">
      {results.map((result, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
            result === 'W'
              ? 'bg-green-600 text-white'
              : result === 'D'
              ? 'bg-gray-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {result}
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Combined Performance Display
 * Shows both sparkline trend and form badges
 */
export const PerformanceDisplay = ({ form, teamName, color = 'teal' }) => {
  if (!form) return null;

  return (
    <div className="space-y-3">
      <PerformanceTrend form={form} teamName={teamName} color={color} />
      <FormBadges form={form} color={color} />
    </div>
  );
};

export default PerformanceTrend;
