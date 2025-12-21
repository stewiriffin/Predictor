/**
 * Real-Time Match Prediction Algorithm
 * This utility calculates winning probabilities based on:
 * - Recent Form (40% weight)
 * - Attack/Defense Strength (30% weight)
 * - Head-to-Head Record (30% weight)
 */

/**
 * Calculate form score from last 5 matches
 * Win = 3 points, Draw = 1 point, Loss = 0 points
 * @param {Array} lastMatches - Array of last 5 matches
 * @param {number} teamId - The team's ID
 * @returns {number} - Form score (0-15)
 */
const calculateFormScore = (lastMatches, teamId) => {
  if (!lastMatches || lastMatches.length === 0) return 7.5; // Neutral if no data

  let points = 0;
  lastMatches.slice(0, 5).forEach(match => {
    const homeTeam = match.teams.home.id;
    const awayTeam = match.teams.away.id;
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;

    const isHome = homeTeam === teamId;
    const teamGoals = isHome ? homeGoals : awayGoals;
    const opponentGoals = isHome ? awayGoals : homeGoals;

    if (teamGoals > opponentGoals) {
      points += 3; // Win
    } else if (teamGoals === opponentGoals) {
      points += 1; // Draw
    }
    // Loss = 0 points
  });

  return points;
};

/**
 * Calculate attack strength from team statistics
 * @param {object} stats - Team statistics object
 * @param {boolean} isHome - Whether the team is playing at home
 * @returns {number} - Attack strength score
 */
const calculateAttackStrength = (stats, isHome) => {
  if (!stats || !stats.goals || !stats.goals.for) return 1.0;

  const location = isHome ? 'home' : 'away';
  const goalsScored = stats.goals.for[location]?.total || 0;
  const matchesPlayed = stats.fixtures.played[location] || 1;

  // Goals per game
  return goalsScored / matchesPlayed;
};

/**
 * Calculate defense strength from team statistics
 * @param {object} stats - Team statistics object
 * @param {boolean} isHome - Whether the team is playing at home
 * @returns {number} - Defense strength score (lower is better)
 */
const calculateDefenseStrength = (stats, isHome) => {
  if (!stats || !stats.goals || !stats.goals.against) return 1.0;

  const location = isHome ? 'home' : 'away';
  const goalsConceded = stats.goals.against[location]?.total || 0;
  const matchesPlayed = stats.fixtures.played[location] || 1;

  // Goals conceded per game
  return goalsConceded / matchesPlayed;
};

/**
 * Calculate head-to-head advantage
 * @param {Array} h2hMatches - Head-to-head match history
 * @param {number} homeTeamId - Home team ID
 * @param {number} awayTeamId - Away team ID
 * @returns {object} - { homeWins, draws, awayWins }
 */
const calculateH2HRecord = (h2hMatches, homeTeamId, awayTeamId) => {
  if (!h2hMatches || h2hMatches.length === 0) {
    return { homeWins: 0, draws: 0, awayWins: 0 };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  h2hMatches.forEach(match => {
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;
    const h2hHomeTeam = match.teams.home.id;

    // Determine which team was home in this H2H match
    const wasCurrentHomeTeamAtHome = h2hHomeTeam === homeTeamId;

    if (homeGoals > awayGoals) {
      if (wasCurrentHomeTeamAtHome) homeWins++;
      else awayWins++;
    } else if (awayGoals > homeGoals) {
      if (wasCurrentHomeTeamAtHome) awayWins++;
      else homeWins++;
    } else {
      draws++;
    }
  });

  return { homeWins, draws, awayWins };
};

/**
 * Main prediction function
 * Calculates win probabilities for home, draw, and away
 * @param {object} homeStats - Home team statistics
 * @param {object} awayStats - Away team statistics
 * @param {Array} homeLastMatches - Home team's last 5 matches
 * @param {Array} awayLastMatches - Away team's last 5 matches
 * @param {Array} h2hMatches - Head-to-head match history
 * @param {number} homeTeamId - Home team ID
 * @param {number} awayTeamId - Away team ID
 * @returns {object} - { homeWin: %, draw: %, awayWin: % }
 */
export const calculatePrediction = (
  homeStats,
  awayStats,
  homeLastMatches,
  awayLastMatches,
  h2hMatches,
  homeTeamId,
  awayTeamId
) => {
  // 1. FORM ANALYSIS (40% weight)
  const homeFormScore = calculateFormScore(homeLastMatches, homeTeamId);
  const awayFormScore = calculateFormScore(awayLastMatches, awayTeamId);

  // Normalize to percentage (max 15 points)
  const homeFormPercentage = (homeFormScore / 15) * 100;
  const awayFormPercentage = (awayFormScore / 15) * 100;
  const formDifference = homeFormPercentage - awayFormPercentage;

  // Form contribution (40% weight)
  const formWeight = 0.4;
  let homeFormContribution = 50 + (formDifference * formWeight);
  let awayFormContribution = 50 - (formDifference * formWeight);

  // 2. ATTACK/DEFENSE STRENGTH ANALYSIS (30% weight)
  const homeAttack = calculateAttackStrength(homeStats, true);
  const homeDefense = calculateDefenseStrength(homeStats, true);
  const awayAttack = calculateAttackStrength(awayStats, false);
  const awayDefense = calculateDefenseStrength(awayStats, false);

  // Home advantage: Home attack vs Away defense
  // Away advantage: Away attack vs Home defense
  const homeAttackAdvantage = homeAttack - awayDefense;
  const awayAttackAdvantage = awayAttack - homeDefense;

  const strengthDifference = homeAttackAdvantage - awayAttackAdvantage;

  // Strength contribution (30% weight)
  const strengthWeight = 0.3;
  const homeStrengthContribution = 50 + (strengthDifference * 15 * strengthWeight);
  const awayStrengthContribution = 50 - (strengthDifference * 15 * strengthWeight);

  // 3. HEAD-TO-HEAD ANALYSIS (30% weight)
  const h2hRecord = calculateH2HRecord(h2hMatches, homeTeamId, awayTeamId);
  const totalH2H = h2hRecord.homeWins + h2hRecord.draws + h2hRecord.awayWins;

  let homeH2HContribution = 50;
  let awayH2HContribution = 50;
  let drawH2HContribution = 0;

  if (totalH2H > 0) {
    const homeH2HPercentage = (h2hRecord.homeWins / totalH2H) * 100;
    const awayH2HPercentage = (h2hRecord.awayWins / totalH2H) * 100;
    const drawH2HPercentage = (h2hRecord.draws / totalH2H) * 100;

    const h2hWeight = 0.3;
    homeH2HContribution = homeH2HPercentage;
    awayH2HContribution = awayH2HPercentage;
    drawH2HContribution = drawH2HPercentage;
  }

  // 4. COMBINE ALL FACTORS
  let homeWinProbability = (homeFormContribution * 0.4) + (homeStrengthContribution * 0.3) + (homeH2HContribution * 0.3);
  let awayWinProbability = (awayFormContribution * 0.4) + (awayStrengthContribution * 0.3) + (awayH2HContribution * 0.3);

  // Draw probability is influenced by:
  // - Close form scores
  // - Balanced attack/defense
  // - H2H draw history
  const formBalance = Math.max(0, 20 - Math.abs(formDifference));
  const strengthBalance = Math.max(0, 20 - Math.abs(strengthDifference * 10));
  const drawProbability = ((formBalance + strengthBalance) / 2) * 0.7 + (drawH2HContribution * 0.3);

  // 5. NORMALIZE TO 100%
  const total = homeWinProbability + drawProbability + awayWinProbability;

  homeWinProbability = (homeWinProbability / total) * 100;
  drawProbability = (drawProbability / total) * 100;
  awayWinProbability = (awayWinProbability / total) * 100;

  // Round to 1 decimal place
  return {
    homeWin: Math.round(homeWinProbability * 10) / 10,
    draw: Math.round(drawProbability * 10) / 10,
    awayWin: Math.round(awayWinProbability * 10) / 10,
    // Additional insights
    insights: {
      homeForm: homeFormScore,
      awayForm: awayFormScore,
      homeAttackStrength: Math.round(homeAttack * 100) / 100,
      awayAttackStrength: Math.round(awayAttack * 100) / 100,
      h2hRecord
    }
  };
};

/**
 * Generate a prediction confidence level
 * @param {object} prediction - The prediction object from calculatePrediction
 * @returns {string} - Confidence level: 'High', 'Medium', or 'Low'
 */
export const getPredictionConfidence = (prediction) => {
  const maxProbability = Math.max(prediction.homeWin, prediction.draw, prediction.awayWin);

  if (maxProbability >= 60) return 'High';
  if (maxProbability >= 45) return 'Medium';
  return 'Low';
};

export default calculatePrediction;
