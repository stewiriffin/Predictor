import { motion } from 'framer-motion';
import { Trophy, Target, AlertCircle, Zap } from 'lucide-react';

/**
 * VerdictBadge - Dynamic headline summarizing the prediction
 * Shows context-aware verdict with appropriate colors and icons
 */
const VerdictBadge = ({ prediction, homeTeam, awayTeam }) => {
  const verdict = calculateVerdict(prediction, homeTeam, awayTeam);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'dominant':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          icon: Trophy
        };
      case 'tight':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          icon: AlertCircle
        };
      case 'goalfest':
        return {
          bg: 'bg-gradient-to-r from-neon-cyan/20 to-neon-teal/20',
          border: 'border-neon-cyan',
          text: 'text-neon-cyan',
          icon: Zap
        };
      case 'deadlock':
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
          border: 'border-gray-500',
          text: 'text-gray-400',
          icon: Target
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-neon-teal/20 to-neon-cyan/20',
          border: 'border-neon-teal',
          text: 'text-neon-teal',
          icon: Target
        };
    }
  };

  const style = getBadgeStyle(verdict.type);
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`${style.bg} rounded-xl p-4 border-2 ${style.border} shadow-lg relative overflow-hidden`}
    >
      {/* Animated background effect */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%'
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className={`w-6 h-6 ${style.text}`} />
        </motion.div>

        {/* Verdict Text */}
        <div className="flex-1">
          <div className="text-xs text-gray-400 font-mono mb-1">MATCH VERDICT</div>
          <div className={`text-lg font-bold font-mono ${style.text}`}>
            {verdict.headline}
          </div>
        </div>

        {/* Confidence indicator */}
        <div className="text-right">
          <div className="text-xs text-gray-400 font-mono">CONFIDENCE</div>
          <div className={`text-sm font-bold font-mono ${style.text}`}>
            {prediction.confidence}
          </div>
        </div>
      </div>

      {/* Subtext */}
      {verdict.subtext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-xs text-gray-400 font-mono"
        >
          {verdict.subtext}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Calculate verdict based on prediction data
 */
const calculateVerdict = (prediction, homeTeam, awayTeam) => {
  const { homeWin, draw, awayWin, expectedGoals } = prediction;
  const totalGoals = expectedGoals.home + expectedGoals.away;
  const homeCleanSheet = expectedGoals.away < 0.5;
  const awayCleanSheet = expectedGoals.home < 0.5;

  // Determine winner
  const winner = homeWin > awayWin ? homeTeam.shortName || homeTeam.name : awayTeam.shortName || awayTeam.name;
  const maxProb = Math.max(homeWin, draw, awayWin);

  // DOMINANT WIN (>60% win probability AND likely clean sheet)
  if (homeWin > 60 && homeCleanSheet) {
    return {
      type: 'dominant',
      headline: `DOMINANT ${homeTeam.shortName?.toUpperCase() || homeTeam.name.toUpperCase()} WIN`,
      subtext: `${homeWin.toFixed(1)}% chance • Clean sheet likely`
    };
  }
  if (awayWin > 60 && awayCleanSheet) {
    return {
      type: 'dominant',
      headline: `DOMINANT ${awayTeam.shortName?.toUpperCase() || awayTeam.name.toUpperCase()} WIN`,
      subtext: `${awayWin.toFixed(1)}% chance • Clean sheet likely`
    };
  }

  // GOAL FEST (>3.5 total goals expected)
  if (totalGoals > 3.5) {
    return {
      type: 'goalfest',
      headline: 'GOAL FEST INCOMING',
      subtext: `${totalGoals.toFixed(1)} goals expected • Both teams to score`
    };
  }

  // DEADLOCK (draw probability >35%)
  if (draw > 35) {
    return {
      type: 'deadlock',
      headline: 'DEADLOCK LIKELY',
      subtext: `${draw.toFixed(1)}% chance of draw • Evenly matched`
    };
  }

  // TIGHT GAME (winner prob <55% or close probabilities)
  if (maxProb < 55 || Math.abs(homeWin - awayWin) < 15) {
    return {
      type: 'tight',
      headline: 'TIGHTLY CONTESTED',
      subtext: `Too close to call • ${winner} slight edge`
    };
  }

  // CLEAR WINNER (50-65% probability)
  if (homeWin > awayWin && homeWin > 50) {
    return {
      type: 'clear',
      headline: `${homeTeam.shortName?.toUpperCase() || homeTeam.name.toUpperCase()} FAVORED`,
      subtext: `${homeWin.toFixed(1)}% win probability • ${expectedGoals.home.toFixed(1)} xG`
    };
  }
  if (awayWin > homeWin && awayWin > 50) {
    return {
      type: 'clear',
      headline: `${awayTeam.shortName?.toUpperCase() || awayTeam.name.toUpperCase()} FAVORED`,
      subtext: `${awayWin.toFixed(1)}% win probability • ${expectedGoals.away.toFixed(1)} xG`
    };
  }

  // DEFAULT
  return {
    type: 'clear',
    headline: `${winner.toUpperCase()} SLIGHT EDGE`,
    subtext: `${maxProb.toFixed(1)}% probability`
  };
};

export default VerdictBadge;
