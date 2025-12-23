import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, RefreshCw } from 'lucide-react';
import MatchCard from './components/MatchCard';
import BettingSlip from './components/BettingSlip';
import { SimulationProvider } from './context/SimulationContext';
import { BettingProvider, useBetting } from './context/BettingContext';
import { COMPETITIONS, fetchMatches, testConnection } from './services/footballApi';
import { generateFallbackMatches } from './services/fallbackData';

/**
 * Skeleton Loader for Match Cards - Cyberpunk Style
 */
const MatchCardSkeleton = () => (
  <div className="bg-gradient-to-br from-cyber-dark via-cyber-slate to-cyber-dark backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-neon-teal/30 animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-gray-700/50 rounded"></div>
        <div className="h-3 w-16 bg-neon-teal/20 rounded"></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-neon-teal/10 rounded-full mb-2 ring-2 ring-neon-teal/20"></div>
          <div className="h-3 w-16 bg-gray-700/50 rounded"></div>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-6 w-12 bg-gray-700/50 rounded"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-neon-magenta/10 rounded-full mb-2 ring-2 ring-neon-magenta/20"></div>
          <div className="h-3 w-16 bg-gray-700/50 rounded"></div>
        </div>
      </div>
      <div className="h-10 bg-gradient-to-r from-neon-teal/20 to-neon-cyan/20 rounded-xl"></div>
    </div>
  </div>
);

/**
 * ProMatch Predictor - Tactical Simulation Engine
 * Production-grade React application with Cyberpunk Sports aesthetic
 */
function AppContent() {
  const [selectedLeague, setSelectedLeague] = useState(COMPETITIONS.BUNDESLIGA);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [bettingSlipOpen, setBettingSlipOpen] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const { balance, stats } = useBetting();

  // Test API connection on mount and periodically
  useEffect(() => {
    const checkConnection = () => {
      testConnection().then(result => {
        setApiStatus(result);
        if (result.success) {
          console.log('[OK] API Status:', result.message);
        } else {
          console.error('[ERROR] API Error:', result.error);
        }
      });
    };

    checkConnection();

    // Re-check connection every 60 seconds
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch matches when league changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    fetchMatches(selectedLeague.code)
      .then(data => {
        if (!data || data.length === 0) {
          console.warn('[WARNING] No matches from API - Using fallback data');
          const fallbackMatches = generateFallbackMatches(selectedLeague.code);
          setMatches(fallbackMatches);
          setUsingFallback(true);
        } else {
          setMatches(data);
          setUsingFallback(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[ERROR] Fatal error fetching matches:', err.message);

        console.warn('[RETRY] Loading fallback data due to error');
        const fallbackMatches = generateFallbackMatches(selectedLeague.code);
        setMatches(fallbackMatches);
        setUsingFallback(true);
        setError(err.message);
        setLoading(false);
      });
  }, [selectedLeague]);

  const handleLeagueChange = (league) => {
    setSelectedLeague(league);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);

    // Force re-fetch
    fetchMatches(selectedLeague.code)
      .then(data => {
        if (!data || data.length === 0) {
          const fallbackMatches = generateFallbackMatches(selectedLeague.code);
          setMatches(fallbackMatches);
          setUsingFallback(true);
        } else {
          setMatches(data);
          setUsingFallback(false);
        }
        setLoading(false);
      })
      .catch(err => {
        const fallbackMatches = generateFallbackMatches(selectedLeague.code);
        setMatches(fallbackMatches);
        setUsingFallback(true);
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-darker via-cyber-dark to-cyber-darker">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(0, 240, 255, 0.3) 0%, transparent 50%), ' +
              'radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.3) 0%, transparent 50%), ' +
              'radial-gradient(circle at 50% 20%, rgba(255, 255, 0, 0.2) 0%, transparent 50%)',
            backgroundSize: '100% 100%'
          }}
        />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <header className="relative backdrop-blur-xl bg-cyber-dark/50 shadow-2xl border-b border-neon-teal/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <motion.div
                animate={{
                  rotate: 360,
                  filter: [
                    'drop-shadow(0 0 8px rgba(0,240,255,0.5))',
                    'drop-shadow(0 0 16px rgba(255,0,255,0.8))',
                    'drop-shadow(0 0 8px rgba(0,240,255,0.5))'
                  ]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="text-5xl font-bold text-neon-teal"
              >
                O
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-teal via-neon-cyan to-neon-magenta bg-clip-text text-transparent font-mono">
                  TACTICAL SIMULATION ENGINE
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-mono">
                  Human-in-the-Loop • Poisson Analytics • Real-Time Control
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap gap-2"
            >
              {Object.values(COMPETITIONS).map((league, index) => (
                <motion.button
                  key={league.code}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,240,255,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLeagueChange(league)}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-300 font-mono border-2 ${
                    selectedLeague.code === league.code
                      ? 'bg-gradient-to-r from-neon-teal to-neon-cyan text-cyber-dark shadow-lg shadow-neon-teal/30 border-neon-teal'
                      : 'bg-cyber-slate/50 text-gray-300 hover:bg-cyber-slate hover:text-neon-teal border-gray-600'
                  }`}
                >
                  {league.name}
                </motion.button>
              ))}
            </motion.div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {apiStatus && (
                <div className={`text-xs font-mono ${apiStatus.success ? 'text-neon-teal' : 'text-red-400'}`}>
                  API_STATUS: {apiStatus.success ? '[OK] CONNECTED' : '[ERROR] ' + apiStatus.error}
                </div>
              )}

              {usingFallback && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-3 py-1"
                >
                  <span className="text-yellow-400 text-xs font-mono font-bold">
                    [!] DEMO MODE
                  </span>
                  <button
                    onClick={handleRetry}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    title="Retry API connection"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBettingSlipOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all font-mono border border-emerald-400/50"
            >
              <Wallet className="w-4 h-4" />
              <span>${balance.toFixed(2)}</span>
              {stats.activeBetsCount > 0 && (
                <span className="bg-white text-emerald-600 rounded-full px-2 py-0.5 text-xs">
                  {stats.activeBetsCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-cyber-dark via-cyber-slate to-cyber-dark backdrop-blur-xl rounded-2xl p-6 border border-neon-teal/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
                <span className="text-3xl">{selectedLeague.emblem}</span>
                <span className="bg-gradient-to-r from-neon-teal to-neon-cyan bg-clip-text text-transparent">
                  {selectedLeague.name}
                </span>
              </h2>
              <p className="text-gray-400 mt-1 font-mono text-sm">
                {selectedLeague.country} • UPCOMING_FIXTURES
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 font-mono">MATCHES_LOADED</div>
              <div className="text-4xl font-bold text-neon-teal font-mono">
                {matches.length}
              </div>
            </div>
          </div>
        </motion.div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, index) => (
              <MatchCardSkeleton key={index} />
            ))}
          </motion.div>
        )}

        {error && usingFallback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl font-bold text-yellow-400">[!]</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-yellow-400 mb-1 font-mono">
                  API CONNECTION ISSUE - USING DEMO DATA
                </h3>
                <p className="text-yellow-200/80 text-xs font-mono mb-2">{error}</p>
                <p className="text-gray-400 text-xs font-mono">
                  The app is running with realistic sample matches. Predictions will work normally.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 rounded-lg font-bold text-xs transition-all font-mono"
              >
                RETRY API
              </button>
            </div>
          </motion.div>
        )}

        {!loading && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MatchCard
                    match={match}
                    competitionCode={selectedLeague.code}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && !usingFallback && matches.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 font-bold text-gray-500">[ ]</div>
            <p className="text-gray-400 text-xl font-mono">
              NO_FIXTURES_SCHEDULED: {selectedLeague.name}
            </p>
            <p className="text-gray-500 text-sm mt-2 font-mono">
              TRY_DIFFERENT_LEAGUE || CHECK_LATER
            </p>
          </motion.div>
        )}
      </main>

      <footer className="relative backdrop-blur-xl bg-cyber-dark/30 border-t border-neon-teal/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2 font-mono">
            <p className="text-gray-400 text-xs">
              POWERED_BY:{' '}
              <a
                href="https://www.football-data.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-teal hover:underline"
              >
                Football-Data.org
              </a>
              {' '}| TECH_STACK: React + Framer-Motion + Recharts + Poisson + Value_Betting
            </p>
            <p className="text-gray-500 text-xs">
              ALGORITHM: Simplified_Poisson_Distribution • USAGE: Educational_Only • Paper_Trading_Mode
            </p>
            <p className="text-gray-600 text-xs mt-4">
              © 2025 TACTICAL_SIMULATION_ENGINE • Production-Grade_Sports_Analytics
            </p>
          </div>
        </div>
      </footer>

      <BettingSlip isOpen={bettingSlipOpen} onClose={() => setBettingSlipOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <BettingProvider>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </BettingProvider>
  );
}

export default App;
