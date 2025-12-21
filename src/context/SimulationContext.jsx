import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Simulation Context - Global State Management for Tactical Simulation
 *
 * Provides real-time control of prediction variables through a human-in-the-loop interface.
 * Allows users to inject their domain knowledge (injuries, stadium effects, etc.) into the prediction model.
 */

const SimulationContext = createContext(null);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
};

export const SimulationProvider = ({ children }) => {
  // Simulation state for each match (keyed by match ID)
  const [simulations, setSimulations] = useState({});

  /**
   * Get simulation state for a specific match
   */
  const getSimulation = useCallback((matchId) => {
    return simulations[matchId] || getDefaultSimulation();
  }, [simulations]);

  /**
   * Update simulation parameters for a match
   */
  const updateSimulation = useCallback((matchId, updates) => {
    setSimulations(prev => ({
      ...prev,
      [matchId]: {
        ...getDefaultSimulation(),
        ...prev[matchId],
        ...updates
      }
    }));
  }, []);

  /**
   * Reset simulation to defaults for a match
   */
  const resetSimulation = useCallback((matchId) => {
    setSimulations(prev => {
      const newState = { ...prev };
      delete newState[matchId];
      return newState;
    });
  }, []);

  /**
   * Toggle a boolean parameter
   */
  const toggleParameter = useCallback((matchId, parameter) => {
    setSimulations(prev => {
      const current = prev[matchId] || getDefaultSimulation();
      return {
        ...prev,
        [matchId]: {
          ...current,
          [parameter]: !current[parameter]
        }
      };
    });
  }, []);

  /**
   * Set a numeric parameter
   */
  const setParameter = useCallback((matchId, parameter, value) => {
    setSimulations(prev => {
      const current = prev[matchId] || getDefaultSimulation();
      return {
        ...prev,
        [matchId]: {
          ...current,
          [parameter]: value
        }
      };
    });
  }, []);

  const value = {
    simulations,
    getSimulation,
    updateSimulation,
    resetSimulation,
    toggleParameter,
    setParameter
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

/**
 * Default simulation parameters
 */
const getDefaultSimulation = () => ({
  // Key Player toggles
  homeKeyPlayerMissing: false,
  awayKeyPlayerMissing: false,

  // Stadium effect
  homeFortress: false,

  // Form weight slider (0-100)
  formWeight: 40, // Default 40% as in original algorithm

  // Additional modifiers
  homeMotivation: 100, // 100 = neutral
  awayMotivation: 100, // 100 = neutral

  // Weather/External factors
  weatherImpact: 0, // -20 to +20

  // Tactical approach
  homeTacticalStyle: 'balanced', // 'defensive', 'balanced', 'attacking'
  awayTacticalStyle: 'balanced',
});

/**
 * Calculate modifiers based on simulation parameters
 * Returns multipliers to be applied to team strengths
 */
export const calculateModifiers = (simulation) => {
  const modifiers = {
    home: {
      attackMultiplier: 1.0,
      defenseMultiplier: 1.0,
      formWeight: simulation.formWeight / 100, // Convert to 0-1
    },
    away: {
      attackMultiplier: 1.0,
      defenseMultiplier: 1.0,
      formWeight: simulation.formWeight / 100,
    }
  };

  // Key Player Missing - reduces attack strength by 30%
  if (simulation.homeKeyPlayerMissing) {
    modifiers.home.attackMultiplier *= 0.7;
  }
  if (simulation.awayKeyPlayerMissing) {
    modifiers.away.attackMultiplier *= 0.7;
  }

  // Home Fortress - boosts home defense by 15%
  if (simulation.homeFortress) {
    modifiers.home.defenseMultiplier *= 0.85; // Lower defense strength means better defense
  }

  // Motivation modifiers
  modifiers.home.attackMultiplier *= (simulation.homeMotivation / 100);
  modifiers.away.attackMultiplier *= (simulation.awayMotivation / 100);

  // Weather impact (affects both teams but home less)
  const weatherFactor = 1 + (simulation.weatherImpact / 100);
  modifiers.home.attackMultiplier *= Math.max(0.8, weatherFactor * 0.9); // Home team less affected
  modifiers.away.attackMultiplier *= Math.max(0.8, weatherFactor);

  // Tactical style adjustments
  const tacticalModifiers = getTacticalModifiers(
    simulation.homeTacticalStyle,
    simulation.awayTacticalStyle
  );

  modifiers.home.attackMultiplier *= tacticalModifiers.home.attack;
  modifiers.home.defenseMultiplier *= tacticalModifiers.home.defense;
  modifiers.away.attackMultiplier *= tacticalModifiers.away.attack;
  modifiers.away.defenseMultiplier *= tacticalModifiers.away.defense;

  return modifiers;
};

/**
 * Get tactical style modifiers
 */
const getTacticalModifiers = (homeStyle, awayStyle) => {
  const styles = {
    defensive: { attack: 0.85, defense: 0.85 },
    balanced: { attack: 1.0, defense: 1.0 },
    attacking: { attack: 1.15, defense: 1.15 }
  };

  return {
    home: styles[homeStyle] || styles.balanced,
    away: styles[awayStyle] || styles.balanced
  };
};

/**
 * Generate a human-readable description of active modifiers
 */
export const getActiveModifiers = (simulation) => {
  const active = [];

  if (simulation.homeKeyPlayerMissing) {
    active.push({
      type: 'negative',
      team: 'home',
      text: 'Key Player Missing',
      impact: '-30% Attack'
    });
  }

  if (simulation.awayKeyPlayerMissing) {
    active.push({
      type: 'negative',
      team: 'away',
      text: 'Key Player Missing',
      impact: '-30% Attack'
    });
  }

  if (simulation.homeFortress) {
    active.push({
      type: 'positive',
      team: 'home',
      text: 'Home Fortress',
      impact: '+15% Defense'
    });
  }

  if (simulation.formWeight !== 40) {
    active.push({
      type: 'neutral',
      team: 'both',
      text: 'Form Weight Adjusted',
      impact: `${simulation.formWeight}%`
    });
  }

  if (simulation.homeMotivation !== 100) {
    active.push({
      type: simulation.homeMotivation > 100 ? 'positive' : 'negative',
      team: 'home',
      text: 'Motivation',
      impact: `${simulation.homeMotivation}%`
    });
  }

  if (simulation.awayMotivation !== 100) {
    active.push({
      type: simulation.awayMotivation > 100 ? 'positive' : 'negative',
      team: 'away',
      text: 'Motivation',
      impact: `${simulation.awayMotivation}%`
    });
  }

  return active;
};

export default SimulationContext;
