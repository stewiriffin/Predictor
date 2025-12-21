import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Calculate Poisson probability: P(X = k) = (λ^k * e^(-λ)) / k!
 */
const poissonProbability = (lambda, k) => {
  if (lambda <= 0) return 0;
  const factorial = (n) => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

/**
 * ScoreHeatmap - Visual matrix showing exact score probabilities
 * Color-coded grid with golden highlight for most likely score
 */
const ScoreHeatmap = ({ expectedGoals, maxScore = 4 }) => {
  // DEFENSIVE CODING: Null safety checks
  if (!expectedGoals || typeof expectedGoals !== 'object') {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
        <p className="text-red-400 text-sm font-mono">
          Unable to generate score heatmap: Missing expected goals data
        </p>
      </div>
    );
  }

  const homeExpectedGoals = expectedGoals?.home ?? 1.5;
  const awayExpectedGoals = expectedGoals?.away ?? 1.5;

  // Generate score matrix with probabilities
  const scoreMatrix = useMemo(() => {
    const matrix = [];
    let maxProb = 0;
    let mostLikelyScore = { home: 0, away: 0 };

    for (let homeGoals = 0; homeGoals <= maxScore; homeGoals++) {
      for (let awayGoals = 0; awayGoals <= maxScore; awayGoals++) {
        const homeProb = poissonProbability(homeExpectedGoals, homeGoals);
        const awayProb = poissonProbability(awayExpectedGoals, awayGoals);
        const probability = homeProb * awayProb;

        matrix.push({
          homeGoals,
          awayGoals,
          probability: probability * 100, // Convert to percentage
          raw: probability
        });

        if (probability > maxProb) {
          maxProb = probability;
          mostLikelyScore = { home: homeGoals, away: awayGoals };
        }
      }
    }

    return { matrix, mostLikelyScore, maxProb: maxProb * 100 };
  }, [homeExpectedGoals, awayExpectedGoals, maxScore]);

  // Get color intensity based on probability
  const getColorClass = (probability, isMax) => {
    if (isMax) return 'bg-yellow-500/40 border-2 border-yellow-400 shadow-lg shadow-yellow-500/50';

    const intensity = probability / scoreMatrix.maxProb;

    if (intensity > 0.7) return 'bg-emerald-500/50 border border-emerald-400/60';
    if (intensity > 0.5) return 'bg-emerald-500/40 border border-emerald-400/50';
    if (intensity > 0.3) return 'bg-emerald-500/30 border border-emerald-400/40';
    if (intensity > 0.15) return 'bg-emerald-500/20 border border-emerald-400/30';
    if (intensity > 0.05) return 'bg-emerald-500/10 border border-emerald-400/20';
    return 'bg-gray-700/20 border border-gray-600/30';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neon-teal font-mono">
          [SCORELINE HEATMAP]
        </h3>
        <div className="text-xs text-gray-400 font-mono">
          Most Likely: {scoreMatrix.mostLikelyScore.home}-{scoreMatrix.mostLikelyScore.away}
        </div>
      </div>

      <div className="bg-cyber-dark/30 rounded-xl p-4 border border-neon-teal/20">
        {/* Away Goals Label (Top) */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-12"></div>
          <div className="flex-1 grid grid-cols-5 gap-1">
            {[...Array(maxScore + 1)].map((_, i) => (
              <div key={i} className="text-center text-xs text-neon-cyan font-mono font-bold">
                {i}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-12"></div>
          <div className="flex-1 text-center text-xs text-neon-cyan font-mono">
            AWAY GOALS →
          </div>
        </div>

        {/* Score Grid */}
        <div className="flex items-start gap-2">
          {/* Home Goals Label (Left) */}
          <div className="flex flex-col items-center gap-1 pt-8">
            <div className="text-xs text-neon-teal font-mono -rotate-90 whitespace-nowrap">
              ← HOME GOALS
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-2">
            {[...Array(maxScore + 1)].map((_, i) => (
              <div key={i} className="text-xs text-neon-teal font-mono font-bold text-right w-8">
                {i}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${maxScore + 1}, 1fr)` }}>
            {scoreMatrix.matrix.map((cell, index) => {
              const isMax = cell.homeGoals === scoreMatrix.mostLikelyScore.home &&
                           cell.awayGoals === scoreMatrix.mostLikelyScore.away;

              return (
                <motion.div
                  key={`${cell.homeGoals}-${cell.awayGoals}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 ${getColorClass(cell.probability, isMax)}`}
                  title={`${cell.homeGoals}-${cell.awayGoals}: ${cell.probability.toFixed(2)}%`}
                >
                  <div className={`text-xs font-bold font-mono ${isMax ? 'text-yellow-300' : 'text-white'}`}>
                    {cell.homeGoals}-{cell.awayGoals}
                  </div>
                  <div className={`text-[10px] font-mono ${isMax ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {cell.probability.toFixed(1)}%
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/40 border border-yellow-400"></div>
              <span className="text-gray-400">Most Likely</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-400/60"></div>
              <span className="text-gray-400">High Prob</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-400/30"></div>
              <span className="text-gray-400">Low Prob</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreHeatmap;
