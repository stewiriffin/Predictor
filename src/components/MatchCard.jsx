import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { getMatchPredictionData } from '../services/footballApi';
import { predictMatch } from '../predictionEngine';
import { useSimulation, calculateModifiers } from '../context/SimulationContext';
import SimulationModal from './SimulationModal';

/**
 * Skeleton Loader Component - Memoized
 */
const SkeletonLoader = memo(() => (
  <div className="space-y-4 animate-pulse">
    <div className="h-64 bg-gray-700/30 rounded-lg"></div>
    <div className="grid grid-cols-3 gap-2">
      <div className="h-4 bg-gray-700/30 rounded"></div>
      <div className="h-4 bg-gray-700/30 rounded"></div>
      <div className="h-4 bg-gray-700/30 rounded"></div>
    </div>
  </div>
));

SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * Enhanced Match Card - Tactical Simulation Engine
 * Optimized with memoization and useCallback
 */
const MatchCard = ({ match, competitionCode }) => {
  const [prediction, setPrediction] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { getSimulation } = useSimulation();
  const simulation = getSimulation(match.id);

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;

  // Memoize date to avoid re-formatting on every render
  const formattedDate = useMemo(() => {
    const matchDate = new Date(match.utcDate);
    return {
      date: format(matchDate, 'EEE, MMM d'),
      time: format(matchDate, 'HH:mm')
    };
  }, [match.utcDate]);

  /**
   * Run prediction with current simulation parameters - Memoized
   */
  const runPrediction = useCallback(async () => {
    if (!matchData) {
      // First time - fetch data
      setLoading(true);
      setError(null);

      try {
        const data = await getMatchPredictionData(match, competitionCode);

        if (!data.homeStats || !data.awayStats) {
          throw new Error('Insufficient team data for prediction');
        }

        setMatchData(data);

        // Calculate with default modifiers
        const modifiers = calculateModifiers(simulation);
        const predictionResult = predictMatch(
          data.homeStats,
          data.awayStats,
          data.leagueAverage,
          modifiers
        );

        setPrediction(predictionResult);
        setModalOpen(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Re-calculate with new modifiers (instant, no loading)
      const modifiers = calculateModifiers(simulation);
      const predictionResult = predictMatch(
        matchData.homeStats,
        matchData.awayStats,
        matchData.leagueAverage,
        modifiers
      );

      setPrediction(predictionResult);
    }
  }, [matchData, match, competitionCode, simulation]);

  // Re-run prediction when simulation parameters change
  useEffect(() => {
    if (matchData) {
      runPrediction();
    }
  }, [simulation, matchData, runPrediction]);

  const handlePredictClick = useCallback(() => {
    if (prediction) {
      setModalOpen(true);
    } else {
      runPrediction();
    }
  }, [prediction, runPrediction]);

  // Memoize chart data to avoid recalculation
  const chartData = useMemo(() => {
    if (!prediction) return [];
    return [
      { name: 'Home Win', value: prediction.homeWin, color: '#00f0ff' },
      { name: 'Draw', value: prediction.draw, color: '#ffff00' },
      { name: 'Away Win', value: prediction.awayWin, color: '#ff00ff' }
    ];
  }, [prediction]);

  const COLORS = useMemo(() => ['#00f0ff', '#ffff00', '#ff00ff'], []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      {/* Main Card - Cyberpunk Style */}
      <div className="relative bg-gradient-to-br from-cyber-dark via-cyber-slate to-cyber-dark backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-neon-teal/30 hover:border-neon-teal/60 transition-all duration-300">
        {/* Match Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-gray-400 font-mono">
            {formattedDate.date}
          </span>
          <span className="text-xs text-neon-teal font-mono font-bold">
            {formattedDate.time}
          </span>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-2 bg-gradient-to-br from-dim-teal to-cyber-slate rounded-full p-3 flex items-center justify-center ring-2 ring-neon-teal/30">
              {homeTeam.crest ? (
                <img
                  src={homeTeam.crest}
                  alt={homeTeam.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl">⚽</span>
              )}
            </div>
            <span className="text-center font-bold text-sm text-neon-teal">
              {homeTeam.shortName || homeTeam.name}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 8px rgba(0,240,255,0.5)',
                  '0 0 16px rgba(255,0,255,0.8)',
                  '0 0 8px rgba(0,240,255,0.5)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-2xl font-bold text-gray-300 font-mono"
            >
              VS
            </motion.div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-2 bg-gradient-to-br from-dim-magenta to-cyber-slate rounded-full p-3 flex items-center justify-center ring-2 ring-neon-magenta/30">
              {awayTeam.crest ? (
                <img
                  src={awayTeam.crest}
                  alt={awayTeam.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl">⚽</span>
              )}
            </div>
            <span className="text-center font-bold text-sm text-neon-magenta">
              {awayTeam.shortName || awayTeam.name}
            </span>
          </div>
        </div>

        {/* Venue */}
        <div className="text-center text-xs text-gray-500 mb-4 font-mono">
          📍 {match.venue || 'Venue TBD'}
        </div>

        {/* Simulation Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePredictClick}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 font-mono ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-neon-teal via-neon-cyan to-neon-teal hover:from-neon-cyan hover:to-neon-teal text-cyber-dark shadow-lg shadow-neon-teal/30'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              ANALYZING...
            </span>
          ) : prediction ? (
            '🔮 VIEW RESULTS'
          ) : (
            '⚡ RUN SIMULATION'
          )}
        </motion.button>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-xs font-mono"
          >
            {error}
          </motion.div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <SkeletonLoader />
          </motion.div>
        )}
      </div>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        match={match}
        prediction={prediction}
        matchData={matchData}
        chartData={chartData}
        COLORS={COLORS}
      />
    </motion.div>
  );
};

export default memo(MatchCard);
