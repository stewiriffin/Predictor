/**
 * ProMatch Predictor - Tactical Simulation Engine
 * Poisson Distribution with Human-in-the-Loop Modifiers
 *
 * Enhanced prediction engine that accepts real-time simulation parameters
 * allowing users to inject domain knowledge (injuries, stadium effects, etc.)
 *
 * References:
 * - Dixon & Coles (1997) "Modelling Association Football Scores"
 * - Maher (1982) "Modelling association football scores"
 */

import { probabilityToDecimal } from './utils/OddsUtils';

/**
 * Calculate factorial for Poisson distribution
 */
const factorial = (n) => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Calculate Poisson probability: P(X = k) = (λ^k * e^(-λ)) / k!
 */
const poissonProbability = (lambda, k) => {
  if (lambda <= 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

/**
 * Calculate attack strength with optional modifiers
 */
const calculateAttackStrength = (goalsScored, matchesPlayed, leagueAverage = 1.5, modifier = 1.0) => {
  if (matchesPlayed === 0) return 1.0;
  const teamGoalsPerGame = goalsScored / matchesPlayed;
  const attackStrength = (teamGoalsPerGame / leagueAverage) * modifier;
  return attackStrength;
};

/**
 * Calculate defense strength with optional modifiers
 */
const calculateDefenseStrength = (goalsConceded, matchesPlayed, leagueAverage = 1.5, modifier = 1.0) => {
  if (matchesPlayed === 0) return 1.0;
  const teamGoalsConcededPerGame = goalsConceded / matchesPlayed;
  const defenseStrength = (teamGoalsConcededPerGame / leagueAverage) * modifier;
  return defenseStrength;
};

/**
 * Calculate expected goals
 */
const calculateExpectedGoals = (attackStrength, defenseStrength, leagueAverage = 1.5) => {
  return attackStrength * defenseStrength * leagueAverage;
};

/**
 * Calculate match outcome probabilities using Poisson distribution
 */
const calculateMatchProbabilities = (homeExpectedGoals, awayExpectedGoals, maxGoals = 10) => {
  let homeWinProbability = 0;
  let drawProbability = 0;
  let awayWinProbability = 0;
  const scoreMatrix = [];

  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals++) {
    const homeProbability = poissonProbability(homeExpectedGoals, homeGoals);

    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals++) {
      const awayProbability = poissonProbability(awayExpectedGoals, awayGoals);
      const scoreProbability = homeProbability * awayProbability;

      scoreMatrix.push({ homeGoals, awayGoals, probability: scoreProbability });

      if (homeGoals > awayGoals) homeWinProbability += scoreProbability;
      else if (homeGoals === awayGoals) drawProbability += scoreProbability;
      else awayWinProbability += scoreProbability;
    }
  }

  const total = homeWinProbability + drawProbability + awayWinProbability;

  return {
    homeWin: (homeWinProbability / total) * 100,
    draw: (drawProbability / total) * 100,
    awayWin: (awayWinProbability / total) * 100,
    scoreMatrix: scoreMatrix.sort((a, b) => b.probability - a.probability).slice(0, 5)
  };
};

/**
 * Calculate form points from form string
 */
const calculateFormPoints = (form) => {
  if (!form) return 0;
  let points = 0;
  for (const result of form) {
    if (result === 'W') points += 3;
    else if (result === 'D') points += 1;
  }
  return points;
};

/**
 * Enhanced prediction function with simulation modifiers
 *
 * @param {object} homeTeamStats - Home team statistics
 * @param {object} awayTeamStats - Away team statistics
 * @param {number} leagueAverage - League average goals per game
 * @param {object} modifiers - Simulation modifiers from context
 * @returns {object} - Complete prediction with insights
 */
export const predictMatch = (homeTeamStats, awayTeamStats, leagueAverage = 1.5, modifiers = null) => {
  // DEFENSIVE CODING: Validate inputs
  if (!homeTeamStats || !awayTeamStats) {
    throw new Error('Missing team statistics. Cannot generate prediction.');
  }

  // Ensure league average is valid
  const safeLeagueAverage = (leagueAverage && leagueAverage > 0) ? leagueAverage : 1.5;

  // Default modifiers if none provided
  const defaultModifiers = {
    home: { attackMultiplier: 1.0, defenseMultiplier: 1.0, formWeight: 0.4 },
    away: { attackMultiplier: 1.0, defenseMultiplier: 1.0, formWeight: 0.4 }
  };

  const mods = modifiers || defaultModifiers;

  // DEFENSIVE CODING: Extract team statistics with fallbacks
  const homeGoalsScored = homeTeamStats?.goalsScored ?? 0;
  const homeGoalsConceded = homeTeamStats?.goalsConceded ?? 0;
  const homeMatchesPlayed = Math.max(1, homeTeamStats?.matchesPlayed ?? 1); // Never 0

  const awayGoalsScored = awayTeamStats?.goalsScored ?? 0;
  const awayGoalsConceded = awayTeamStats?.goalsConceded ?? 0;
  const awayMatchesPlayed = Math.max(1, awayTeamStats?.matchesPlayed ?? 1); // Never 0

  // Calculate strengths with modifiers
  const homeAttackStrength = calculateAttackStrength(
    homeGoalsScored,
    homeMatchesPlayed,
    safeLeagueAverage,
    mods.home.attackMultiplier
  );

  const homeDefenseStrength = calculateDefenseStrength(
    homeGoalsConceded,
    homeMatchesPlayed,
    safeLeagueAverage,
    mods.home.defenseMultiplier
  );

  const awayAttackStrength = calculateAttackStrength(
    awayGoalsScored,
    awayMatchesPlayed,
    safeLeagueAverage,
    mods.away.attackMultiplier
  );

  const awayDefenseStrength = calculateDefenseStrength(
    awayGoalsConceded,
    awayMatchesPlayed,
    safeLeagueAverage,
    mods.away.defenseMultiplier
  );

  // Calculate expected goals
  const homeExpectedGoals = calculateExpectedGoals(homeAttackStrength, awayDefenseStrength, safeLeagueAverage);
  const awayExpectedGoals = calculateExpectedGoals(awayAttackStrength, homeDefenseStrength, safeLeagueAverage);

  // Calculate probabilities
  const probabilities = calculateMatchProbabilities(homeExpectedGoals, awayExpectedGoals);

  // Generate insights with explainable AI logic
  const insights = generateInsights(
    homeTeamStats,
    awayTeamStats,
    homeAttackStrength,
    awayAttackStrength,
    homeDefenseStrength,
    awayDefenseStrength,
    homeExpectedGoals,
    awayExpectedGoals,
    probabilities,
    mods
  );

  // Calculate fair odds from probabilities
  const fairOdds = {
    home: probabilityToDecimal(probabilities.homeWin),
    draw: probabilityToDecimal(probabilities.draw),
    away: probabilityToDecimal(probabilities.awayWin)
  };

  return {
    homeWin: Math.round(probabilities.homeWin * 10) / 10,
    draw: Math.round(probabilities.draw * 10) / 10,
    awayWin: Math.round(probabilities.awayWin * 10) / 10,
    fairOdds, // Add fair decimal odds
    expectedGoals: {
      home: Math.round(homeExpectedGoals * 100) / 100,
      away: Math.round(awayExpectedGoals * 100) / 100
    },
    strengths: {
      homeAttack: Math.round(homeAttackStrength * 100) / 100,
      awayAttack: Math.round(awayAttackStrength * 100) / 100,
      homeDefense: Math.round(homeDefenseStrength * 100) / 100,
      awayDefense: Math.round(awayDefenseStrength * 100) / 100
    },
    likelyScores: probabilities.scoreMatrix.map(score => ({
      homeGoals: score.homeGoals,
      awayGoals: score.awayGoals,
      probability: Math.round(score.probability * 1000) / 10
    })),
    insights,
    confidence: calculateConfidence(probabilities),
    radarData: generateRadarData(homeTeamStats, awayTeamStats, homeAttackStrength, awayAttackStrength)
  };
};

/**
 * EXPLAINABLE AI - Generate natural language insights
 * Returns contextual explanations of the prediction
 */
export const generateInsights = (
  homeTeamStats,
  awayTeamStats,
  homeAttack,
  awayAttack,
  homeDefense,
  awayDefense,
  homeExpectedGoals,
  awayExpectedGoals,
  probabilities,
  modifiers
) => {
  const insights = [];
  const homeName = homeTeamStats.name || 'Home Team';
  const awayName = awayTeamStats.name || 'Away Team';

  // Main prediction insight
  const winner = probabilities.homeWin > probabilities.awayWin ? homeName : awayName;
  const winnerProb = Math.max(probabilities.homeWin, probabilities.awayWin);
  const winnerAttack = probabilities.homeWin > probabilities.awayWin ? homeAttack : awayAttack;

  insights.push(
    `Although ${probabilities.homeWin > probabilities.awayWin ? awayName : homeName} has competitive stats, ` +
    `${winner}'s superior Attack Rating (${winnerAttack.toFixed(2)}) gives them a ${winnerProb.toFixed(1)}% edge in this simulation.`
  );

  // Attack comparison
  const attackDifference = ((homeAttack - awayAttack) / Math.min(homeAttack, awayAttack)) * 100;
  if (Math.abs(attackDifference) > 20) {
    const stronger = attackDifference > 0 ? homeName : awayName;
    insights.push(`${stronger} possesses a ${Math.abs(Math.round(attackDifference))}% stronger offensive threat.`);
  }

  // Defense comparison
  const defenseDifference = ((awayDefense - homeDefense) / Math.min(homeDefense, awayDefense)) * 100;
  if (Math.abs(defenseDifference) > 20) {
    const stronger = defenseDifference > 0 ? awayName : homeName;
    insights.push(`${stronger} maintains a ${Math.abs(Math.round(defenseDifference))}% tighter defensive line.`);
  }

  // Expected goals analysis
  if (homeExpectedGoals > awayExpectedGoals * 1.5) {
    insights.push(`${homeName} projected to dominate possession with ${homeExpectedGoals.toFixed(1)} xG vs ${awayExpectedGoals.toFixed(1)} xG.`);
  } else if (awayExpectedGoals > homeExpectedGoals * 1.5) {
    insights.push(`${awayName} expected to control the tempo with ${awayExpectedGoals.toFixed(1)} xG vs ${homeExpectedGoals.toFixed(1)} xG.`);
  } else {
    insights.push(`Evenly matched encounter: ${homeExpectedGoals.toFixed(1)} vs ${awayExpectedGoals.toFixed(1)} expected goals.`);
  }

  // Form analysis
  if (homeTeamStats.form && awayTeamStats.form) {
    const homeFormPoints = calculateFormPoints(homeTeamStats.form);
    const awayFormPoints = calculateFormPoints(awayTeamStats.form);

    if (homeFormPoints > awayFormPoints + 3) {
      insights.push(`${homeName} riding a wave of momentum with superior recent form (${homeFormPoints}pts vs ${awayFormPoints}pts).`);
    } else if (awayFormPoints > homeFormPoints + 3) {
      insights.push(`${awayName} brings exceptional recent form into this fixture (${awayFormPoints}pts vs ${homeFormPoints}pts).`);
    }
  }

  if (modifiers) {
    if (modifiers.home.attackMultiplier < 1.0) {
      insights.push(`[NOTE] Simulation accounts for ${homeName}'s weakened attack (key player absence impact).`);
    }
    if (modifiers.away.attackMultiplier < 1.0) {
      insights.push(`[NOTE] Simulation accounts for ${awayName}'s weakened attack (key player absence impact).`);
    }
    if (modifiers.home.defenseMultiplier < 1.0) {
      insights.push(`[HOME] Home fortress advantage activated - ${homeName}'s defense amplified by crowd support.`);
    }
  }

  return insights;
};

/**
 * Generate radar chart data for tactical comparison
 */
export const generateRadarData = (homeTeamStats, awayTeamStats, homeAttack, awayAttack) => {
  const homeForm = homeTeamStats.form ? calculateFormPoints(homeTeamStats.form) : 7.5;
  const awayForm = awayTeamStats.form ? calculateFormPoints(awayTeamStats.form) : 7.5;

  return [
    {
      metric: 'Attack',
      home: Math.min(100, homeAttack * 50), // Scale to 0-100
      away: Math.min(100, awayAttack * 50)
    },
    {
      metric: 'Defense',
      home: Math.min(100, (2 - (homeTeamStats.goalsConceded / homeTeamStats.matchesPlayed)) * 40),
      away: Math.min(100, (2 - (awayTeamStats.goalsConceded / awayTeamStats.matchesPlayed)) * 40)
    },
    {
      metric: 'Form',
      home: (homeForm / 15) * 100,
      away: (awayForm / 15) * 100
    },
    {
      metric: 'Goals/Game',
      home: Math.min(100, (homeTeamStats.goalsScored / homeTeamStats.matchesPlayed) * 30),
      away: Math.min(100, (awayTeamStats.goalsScored / awayTeamStats.matchesPlayed) * 30)
    },
    {
      metric: 'Consistency',
      home: homeTeamStats.won ? (homeTeamStats.won / homeTeamStats.matchesPlayed) * 100 : 50,
      away: awayTeamStats.won ? (awayTeamStats.won / awayTeamStats.matchesPlayed) * 100 : 50
    }
  ];
};

/**
 * Calculate prediction confidence
 */
const calculateConfidence = (probabilities) => {
  const maxProbability = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin);
  if (maxProbability >= 55) return 'High';
  if (maxProbability >= 40) return 'Medium';
  return 'Low';
};

export default predictMatch;
