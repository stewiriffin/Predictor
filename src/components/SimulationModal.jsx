import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SimulationControls from './SimulationControls';
import PredictionRadar from './PredictionRadar';
import { PerformanceDisplay } from './PerformanceTrend';
import ScoreHeatmap from './ScoreHeatmap';
import StatBattle from './StatBattle';
import VerdictBadge from './VerdictBadge';
import ConfidenceMeter from './ConfidenceMeter';

/**
 * Full-Screen Simulation Modal
 * Displays prediction results in a clean, focused overlay
 */
const SimulationModal = ({
  isOpen,
  onClose,
  match,
  prediction,
  matchData,
  chartData,
  COLORS
}) => {
  if (!isOpen || !prediction) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal - Large Floating Screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-2 md:inset-4 lg:inset-6 z-50 overflow-hidden"
          >
            <div className="h-full bg-gradient-to-br from-cyber-dark via-cyber-slate to-cyber-dark rounded-xl md:rounded-2xl border-2 border-neon-teal/50 shadow-2xl shadow-neon-teal/20 overflow-hidden flex flex-col">

              {/* Modal Header */}
              <div className="bg-cyber-dark/50 border-b border-neon-teal/30 p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <span className="text-neon-teal">{match.homeTeam.name}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-neon-magenta">{match.awayTeam.name}</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    TACTICAL SIMULATION • POISSON ANALYSIS
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                >
                  <X className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">

                  {/* LEFT COLUMN - Predictions & Charts */}
                  <div className="space-y-6">

                    {/* Verdict Badge - Dynamic headline */}
                    <VerdictBadge
                      prediction={prediction}
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                    />

                    {/* Score Heatmap - Visual matrix of exact scores */}
                    <ScoreHeatmap expectedGoals={prediction.expectedGoals} />

                    {/* Stat Battle - Tale of the Tape comparison */}
                    <StatBattle
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                      prediction={prediction}
                      matchData={matchData}
                    />

                    {/* Tactical Radar */}
                    {prediction.radarData && (
                      <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
                        <h3 className="text-sm font-bold text-neon-teal mb-4 font-mono">
                          [TACTICAL COMPARISON]
                        </h3>
                        <PredictionRadar data={prediction.radarData} />
                      </div>
                    )}

                    {/* Recent Form */}
                    {(matchData?.homeStats?.form || matchData?.awayStats?.form) && (
                      <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
                        <h3 className="text-sm font-bold text-neon-teal mb-4 font-mono">
                          [RECENT FORM]
                        </h3>
                        <div className="space-y-4">
                          {matchData.homeStats?.form && (
                            <PerformanceDisplay
                              teamName={match.homeTeam.name}
                              form={matchData.homeStats.form}
                              color="teal"
                            />
                          )}
                          {matchData.awayStats?.form && (
                            <PerformanceDisplay
                              teamName={match.awayTeam.name}
                              form={matchData.awayStats.form}
                              color="magenta"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN - Controls & Insights */}
                  <div className="space-y-6">

                    {/* Confidence Meter - Algorithm certainty */}
                    <ConfidenceMeter prediction={prediction} />

                    {/* Tactical Controls */}
                    <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
                      <h3 className="text-sm font-bold text-neon-teal mb-4 font-mono">
                        [TACTICAL CONTROLS]
                      </h3>
                      <SimulationControls matchId={match.id} />
                    </div>

                    {/* AI Insights */}
                    {prediction.insights && prediction.insights.length > 0 && (
                      <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
                        <h3 className="text-sm font-bold text-neon-teal mb-4 font-mono">
                          [AI INSIGHTS]
                        </h3>
                        <div className="space-y-3">
                          {prediction.insights.map((insight, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-neon-teal/5 rounded-lg p-4 border border-neon-teal/20"
                            >
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {insight}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected Goals */}
                    <div className="bg-cyber-dark/30 rounded-xl p-6 border border-neon-teal/20">
                      <h3 className="text-sm font-bold text-neon-teal mb-4 font-mono">
                        [EXPECTED GOALS]
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-neon-teal font-mono">
                            {prediction.expectedGoals?.home?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-400 mt-2 font-mono">
                            {match.homeTeam.shortName}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-neon-magenta font-mono">
                            {prediction.expectedGoals?.away?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-400 mt-2 font-mono">
                            {match.awayTeam.shortName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-cyber-dark/50 border-t border-neon-teal/30 p-4">
                <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                  <span>POWERED_BY: Poisson Distribution Algorithm</span>
                  <span>HUMAN-IN-THE-LOOP: Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SimulationModal;
