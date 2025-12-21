import { motion } from 'framer-motion';
import { useSimulation, getActiveModifiers } from '../context/SimulationContext';

/**
 * Tactical Control Panel - Human-in-the-Loop Interface
 *
 * Allows users to inject domain knowledge into the prediction model:
 * - Key player injuries
 * - Stadium atmosphere effects
 * - Adjustable form weightings
 *
 * Real-time updates trigger re-calculation of probabilities
 */
const SimulationControls = ({ matchId, homeTeam, awayTeam, onUpdate }) => {
  const { getSimulation, toggleParameter, setParameter } = useSimulation();
  const simulation = getSimulation(matchId);
  const activeModifiers = getActiveModifiers(simulation);

  const handleToggle = (parameter) => {
    toggleParameter(matchId, parameter);
    if (onUpdate) onUpdate();
  };

  const handleSliderChange = (parameter, value) => {
    setParameter(matchId, parameter, value);
    if (onUpdate) onUpdate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-cyber-dark border border-neon-teal/30 rounded-xl p-6 shadow-neon-glow"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-neon-teal mb-1 font-mono">
          ⚙️ TACTICAL CONTROL PANEL
        </h3>
        <p className="text-xs text-gray-400">
          Human-in-the-Loop Simulation
        </p>
      </div>

      {/* Key Player Missing Toggles */}
      <div className="space-y-4 mb-6">
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Key Player Availability
          </h4>

          {/* Home Team Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <span className="text-neon-teal">●</span>
                {homeTeam?.shortName || 'Home'} Star Missing
              </label>
              <p className="text-xs text-gray-500 ml-4">-30% Attack Strength</p>
            </div>
            <ToggleSwitch
              checked={simulation.homeKeyPlayerMissing}
              onChange={() => handleToggle('homeKeyPlayerMissing')}
              color="teal"
            />
          </div>

          {/* Away Team Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <span className="text-neon-magenta">●</span>
                {awayTeam?.shortName || 'Away'} Star Missing
              </label>
              <p className="text-xs text-gray-500 ml-4">-30% Attack Strength</p>
            </div>
            <ToggleSwitch
              checked={simulation.awayKeyPlayerMissing}
              onChange={() => handleToggle('awayKeyPlayerMissing')}
              color="magenta"
            />
          </div>
        </div>

        {/* Home Fortress Toggle */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Stadium Atmosphere
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <span className="text-neon-yellow">🏟️</span>
                Home Fortress Mode
              </label>
              <p className="text-xs text-gray-500 ml-6">+15% Defensive Boost</p>
            </div>
            <ToggleSwitch
              checked={simulation.homeFortress}
              onChange={() => handleToggle('homeFortress')}
              color="yellow"
            />
          </div>
        </div>

        {/* Form Weight Slider */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Algorithm Tuning
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">
                Form Weight
              </label>
              <span className="text-neon-cyan font-mono text-lg font-bold">
                {simulation.formWeight}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={simulation.formWeight}
              onChange={(e) => handleSliderChange('formWeight', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-custom"
            />

            <p className="text-xs text-gray-500">
              How much should recent form (last 5 games) influence the prediction?
            </p>
          </div>
        </div>
      </div>

      {/* Active Modifiers Summary */}
      {activeModifiers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-700 pt-4"
        >
          <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Active Modifiers ({activeModifiers.length})
          </h4>
          <div className="space-y-2">
            {activeModifiers.map((modifier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-2 rounded ${
                  modifier.type === 'positive'
                    ? 'bg-green-900/20 border border-green-500/30'
                    : modifier.type === 'negative'
                    ? 'bg-red-900/20 border border-red-500/30'
                    : 'bg-blue-900/20 border border-blue-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${
                    modifier.team === 'home' ? 'text-neon-teal' :
                    modifier.team === 'away' ? 'text-neon-magenta' :
                    'text-neon-cyan'
                  }`}>
                    {modifier.team === 'home' ? '⬤' : modifier.team === 'away' ? '⬤' : '⬤⬤'}
                  </span>
                  <span className="text-xs text-gray-300">{modifier.text}</span>
                </div>
                <span className="text-xs font-mono text-gray-400">{modifier.impact}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const { resetSimulation } = useSimulation();
          resetSimulation(matchId);
          if (onUpdate) onUpdate();
        }}
        className="w-full mt-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-mono border border-gray-600 transition-all"
      >
        ↺ RESET TO DEFAULTS
      </motion.button>

      <style jsx>{`
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #00f0ff, #00ffff);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .slider-custom::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #00f0ff, #00ffff);
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .slider-custom::-webkit-slider-runnable-track {
          background: linear-gradient(to right,
            rgba(0, 240, 255, 0.3) 0%,
            rgba(0, 240, 255, 0.3) var(--value),
            rgba(55, 65, 81, 1) var(--value),
            rgba(55, 65, 81, 1) 100%);
        }
      `}</style>
    </motion.div>
  );
};

/**
 * Custom Toggle Switch Component
 */
const ToggleSwitch = ({ checked, onChange, color = 'teal' }) => {
  const colors = {
    teal: {
      bg: checked ? 'bg-neon-teal' : 'bg-gray-600',
      shadow: checked ? 'shadow-neon-teal' : '',
    },
    magenta: {
      bg: checked ? 'bg-neon-magenta' : 'bg-gray-600',
      shadow: checked ? 'shadow-neon-magenta' : '',
    },
    yellow: {
      bg: checked ? 'bg-neon-yellow' : 'bg-gray-600',
      shadow: checked ? 'shadow-lg' : '',
    }
  };

  const selectedColor = colors[color] || colors.teal;

  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selectedColor.bg}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        } ${selectedColor.shadow}`}
      />
    </button>
  );
};

export default SimulationControls;
