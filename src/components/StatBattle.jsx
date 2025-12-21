import { motion } from 'framer-motion';

/**
 * StatBattle - "Tale of the Tape" comparison component
 * Horizontal bars growing from center axis comparing key metrics
 */
const StatBattle = ({ homeTeam, awayTeam, prediction, matchData }) => {
  // DEFENSIVE CODING: Null safety checks
  if (!prediction || !homeTeam || !awayTeam) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
        <p className="text-red-400 text-sm font-mono">
          Unable to generate stat battle: Missing prediction or team data
        </p>
      </div>
    );
  }

  // Safe access with fallbacks
  const strengths = prediction?.strengths ?? {
    homeAttack: 1,
    awayAttack: 1,
    homeDefense: 1,
    awayDefense: 1
  };

  // Prepare stat comparisons
  const stats = [
    {
      label: 'ATTACK',
      home: (strengths?.homeAttack ?? 1) * 50, // Scale to 0-100
      away: (strengths?.awayAttack ?? 1) * 50,
      homeRaw: strengths?.homeAttack ?? 1,
      awayRaw: strengths?.awayAttack ?? 1
    },
    {
      label: 'DEFENSE',
      home: Math.max(0, (2 - (strengths?.homeDefense ?? 1)) * 50), // Invert (lower is better)
      away: Math.max(0, (2 - (strengths?.awayDefense ?? 1)) * 50),
      homeRaw: strengths?.homeDefense ?? 1,
      awayRaw: strengths?.awayDefense ?? 1
    },
    {
      label: 'FORM',
      home: matchData?.homeStats?.form ? calculateFormScore(matchData.homeStats.form) : 50,
      away: matchData?.awayStats?.form ? calculateFormScore(matchData.awayStats.form) : 50,
      homeRaw: matchData?.homeStats?.form || 'N/A',
      awayRaw: matchData?.awayStats?.form || 'N/A'
    },
    {
      label: 'WIN %',
      home: prediction?.homeWin ?? 33,
      away: prediction?.awayWin ?? 33,
      homeRaw: `${(prediction?.homeWin ?? 33).toFixed(1)}%`,
      awayRaw: `${(prediction?.awayWin ?? 33).toFixed(1)}%`
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-neon-teal font-mono">
        [TALE OF THE TAPE]
      </h3>

      <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              homeValue={stat.home}
              awayValue={stat.away}
              homeRaw={stat.homeRaw}
              awayRaw={stat.awayRaw}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Team Labels */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-neon-teal"></div>
            <span className="text-xs font-mono text-neon-teal font-bold">
              {homeTeam.shortName || homeTeam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neon-cyan font-bold">
              {awayTeam.shortName || awayTeam.name}
            </span>
            <div className="w-3 h-3 rounded-full bg-neon-cyan"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual stat bar with center axis
 */
const StatBar = ({ label, homeValue, awayValue, homeRaw, awayRaw, homeTeam, awayTeam, delay }) => {
  const homePercent = Math.min(100, Math.max(0, homeValue));
  const awayPercent = Math.min(100, Math.max(0, awayValue));

  return (
    <div className="space-y-1">
      {/* Label */}
      <div className="text-center text-xs text-gray-400 font-mono font-bold">
        {label}
      </div>

      {/* Bar Container */}
      <div className="flex items-center gap-2">
        {/* Home Value */}
        <div className="w-12 text-right">
          <span className="text-xs font-bold text-neon-teal font-mono">
            {typeof homeRaw === 'number' ? homeRaw.toFixed(2) : homeRaw}
          </span>
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-center">
          {/* Home Bar (grows right to left) */}
          <div className="flex-1 flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${homePercent}%` }}
              transition={{ duration: 0.8, delay, ease: 'easeOut' }}
              className="h-6 bg-gradient-to-r from-neon-teal/30 to-neon-teal rounded-l-lg border-2 border-neon-teal/50 relative"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent to-neon-teal/20 animate-pulse"
              />
            </motion.div>
          </div>

          {/* Center Line */}
          <div className="w-px h-8 bg-gray-600"></div>

          {/* Away Bar (grows left to right) */}
          <div className="flex-1 flex justify-start">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${awayPercent}%` }}
              transition={{ duration: 0.8, delay, ease: 'easeOut' }}
              className="h-6 bg-gradient-to-l from-neon-cyan/30 to-neon-cyan rounded-r-lg border-2 border-neon-cyan/50 relative"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 }}
                className="absolute inset-0 bg-gradient-to-l from-transparent to-neon-cyan/20 animate-pulse"
              />
            </motion.div>
          </div>
        </div>

        {/* Away Value */}
        <div className="w-12 text-left">
          <span className="text-xs font-bold text-neon-cyan font-mono">
            {typeof awayRaw === 'number' ? awayRaw.toFixed(2) : awayRaw}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate form score from form string (WDLWW -> 0-100)
 */
const calculateFormScore = (form) => {
  if (!form || form.length === 0) return 50;

  let points = 0;
  const maxPoints = form.length * 3; // 3 points per win

  for (const result of form) {
    if (result === 'W') points += 3;
    else if (result === 'D') points += 1;
  }

  return (points / maxPoints) * 100;
};

export default StatBattle;
