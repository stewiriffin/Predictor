import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Tactical Comparison Radar Chart
 *
 * Visualizes multi-dimensional team comparison across:
 * - Attack strength
 * - Defensive capabilities
 * - Recent form
 * - Goals per game
 * - Consistency metrics
 *
 * Home team (Teal) vs Away team (Magenta) overlapping polygons
 */
const PredictionRadar = ({ radarData, homeTeam, awayTeam }) => {
  if (!radarData || radarData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cyber-dark border border-neon-teal/50 rounded-lg p-3 shadow-neon-glow">
          <p className="text-xs text-gray-400 mb-2">{payload[0].payload.metric}</p>
          <div className="space-y-1">
            <p className="text-sm font-mono">
              <span className="text-neon-teal">⬤ {homeTeam?.shortName || 'Home'}:</span>{' '}
              <span className="text-white font-bold">{payload[0].value.toFixed(1)}</span>
            </p>
            <p className="text-sm font-mono">
              <span className="text-neon-magenta">⬤ {awayTeam?.shortName || 'Away'}:</span>{' '}
              <span className="text-white font-bold">{payload[1].value.toFixed(1)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-teal shadow-neon-teal"></div>
        <span className="text-xs text-gray-300 font-mono">
          {homeTeam?.shortName || 'Home'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-magenta shadow-neon-magenta"></div>
        <span className="text-xs text-gray-300 font-mono">
          {awayTeam?.shortName || 'Away'}
        </span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-cyber-slate/30 rounded-xl p-6 border border-neon-teal/20"
    >
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-neon-teal font-mono mb-1">
          📊 TACTICAL RADAR
        </h4>
        <p className="text-xs text-gray-400">
          Multi-Dimensional Team Comparison
        </p>
      </div>

      {/* Radar Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid
              stroke="#334155"
              strokeWidth={1}
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#475569' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#475569' }}
            />

            {/* Home Team Polygon */}
            <Radar
              name={homeTeam?.shortName || 'Home'}
              dataKey="home"
              stroke="#00f0ff"
              fill="#00f0ff"
              fillOpacity={0.3}
              strokeWidth={2}
            />

            {/* Away Team Polygon */}
            <Radar
              name={awayTeam?.shortName || 'Away'}
              dataKey="away"
              stroke="#ff00ff"
              fill="#ff00ff"
              fillOpacity={0.3}
              strokeWidth={2}
            />

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        <CustomLegend />
      </div>

      {/* Metric Breakdown */}
      <div className="mt-6 space-y-2 border-t border-gray-700 pt-4">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Metric Breakdown
        </h5>
        {radarData.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-gray-400">{metric.metric}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-neon-teal">⬤</span>
                <span className="font-mono text-gray-300">{metric.home.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neon-magenta">⬤</span>
                <span className="font-mono text-gray-300">{metric.away.toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analysis Summary */}
      <div className="mt-6 p-3 bg-cyber-dark/50 rounded-lg border border-neon-cyan/30">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-neon-cyan font-bold">ANALYSIS:</span>{' '}
          {getRadarInsight(radarData, homeTeam, awayTeam)}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Generate insight from radar data
 */
const getRadarInsight = (radarData, homeTeam, awayTeam) => {
  if (!radarData || radarData.length === 0) return 'Insufficient data for analysis.';

  // Calculate average scores
  const homeAvg = radarData.reduce((sum, m) => sum + m.home, 0) / radarData.length;
  const awayAvg = radarData.reduce((sum, m) => sum + m.away, 0) / radarData.length;

  // Find strongest metrics
  const homeStrongest = radarData.reduce((max, m) => m.home > max.home ? m : max, radarData[0]);
  const awayStrongest = radarData.reduce((max, m) => m.away > max.away ? m : max, radarData[0]);

  const homeNameShort = homeTeam?.shortName || 'Home';
  const awayNameShort = awayTeam?.shortName || 'Away';

  if (Math.abs(homeAvg - awayAvg) < 5) {
    return `Evenly matched across all dimensions (${homeAvg.toFixed(1)} vs ${awayAvg.toFixed(1)}). ${homeNameShort} excels in ${homeStrongest.metric}, while ${awayNameShort} dominates ${awayStrongest.metric}.`;
  } else if (homeAvg > awayAvg) {
    const diff = ((homeAvg - awayAvg) / awayAvg * 100).toFixed(0);
    return `${homeNameShort} holds tactical superiority (+${diff}% overall). Primary advantage: ${homeStrongest.metric} (${homeStrongest.home.toFixed(1)}).`;
  } else {
    const diff = ((awayAvg - homeAvg) / homeAvg * 100).toFixed(0);
    return `${awayNameShort} demonstrates tactical dominance (+${diff}% overall). Key strength: ${awayStrongest.metric} (${awayStrongest.away.toFixed(1)}).`;
  }
};

export default PredictionRadar;
