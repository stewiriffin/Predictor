/**
 * OddsUtils.js
 * Helper functions for odds conversions and value betting calculations
 */

/**
 * Convert probability percentage to decimal odds
 * @param {number} probability - Win probability as percentage (0-100)
 * @returns {number} - Decimal odds
 */
export const probabilityToDecimal = (probability) => {
  if (probability <= 0 || probability > 100) return 0;
  return parseFloat((1 / (probability / 100)).toFixed(2));
};

/**
 * Convert decimal odds to probability percentage
 * @param {number} decimalOdds - Decimal odds
 * @returns {number} - Probability as percentage
 */
export const decimalToProbability = (decimalOdds) => {
  if (decimalOdds <= 1) return 0;
  return parseFloat(((1 / decimalOdds) * 100).toFixed(2));
};

/**
 * Convert decimal odds to fractional odds
 * @param {number} decimalOdds - Decimal odds
 * @returns {string} - Fractional odds (e.g., "5/2")
 */
export const decimalToFractional = (decimalOdds) => {
  if (decimalOdds < 1) return '0/1';

  const numerator = decimalOdds - 1;
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

  // Convert to fraction
  const denominator = 100;
  const num = Math.round(numerator * denominator);
  const divisor = gcd(num, denominator);

  return `${num / divisor}/${denominator / divisor}`;
};

/**
 * Convert decimal odds to American odds
 * @param {number} decimalOdds - Decimal odds
 * @returns {string} - American odds (e.g., "+150" or "-200")
 */
export const decimalToAmerican = (decimalOdds) => {
  if (decimalOdds < 1) return '+0';

  if (decimalOdds >= 2) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimalOdds - 1))}`;
  }
};

/**
 * Calculate expected value of a bet
 * @param {number} stake - Amount to bet
 * @param {number} bookieOdds - Bookmaker's decimal odds
 * @param {number} trueProbability - Model's probability percentage
 * @returns {number} - Expected value (positive = good bet)
 */
export const calculateExpectedValue = (stake, bookieOdds, trueProbability) => {
  const winAmount = stake * bookieOdds;
  const loseAmount = stake;
  const winProbability = trueProbability / 100;
  const loseProbability = 1 - winProbability;

  const ev = (winAmount * winProbability) - (loseAmount * loseProbability);
  return parseFloat(ev.toFixed(2));
};

/**
 * Calculate if a bet has value
 * @param {number} bookieOdds - Bookmaker's decimal odds
 * @param {number} modelOdds - Model's fair decimal odds
 * @returns {object} - { hasValue: boolean, edge: number }
 */
export const detectValue = (bookieOdds, modelOdds) => {
  if (!bookieOdds || !modelOdds) return { hasValue: false, edge: 0 };

  const bookieProbability = decimalToProbability(bookieOdds);
  const modelProbability = decimalToProbability(modelOdds);
  const edge = modelProbability - bookieProbability;

  return {
    hasValue: bookieOdds > modelOdds, // Bookie underestimating = value
    edge: parseFloat(edge.toFixed(2))
  };
};

/**
 * Calculate potential profit
 * @param {number} stake - Amount to bet
 * @param {number} decimalOdds - Decimal odds
 * @returns {number} - Potential profit (excluding stake)
 */
export const calculateProfit = (stake, decimalOdds) => {
  return parseFloat((stake * (decimalOdds - 1)).toFixed(2));
};

/**
 * Calculate potential payout
 * @param {number} stake - Amount to bet
 * @param {number} decimalOdds - Decimal odds
 * @returns {number} - Total payout (including stake)
 */
export const calculatePayout = (stake, decimalOdds) => {
  return parseFloat((stake * decimalOdds).toFixed(2));
};

/**
 * Calculate ROI (Return on Investment)
 * @param {number} profit - Total profit
 * @param {number} totalStaked - Total amount staked
 * @returns {number} - ROI as percentage
 */
export const calculateROI = (profit, totalStaked) => {
  if (totalStaked === 0) return 0;
  return parseFloat(((profit / totalStaked) * 100).toFixed(2));
};

/**
 * Remove bookmaker margin (vig) from odds
 * @param {number} homeOdds - Home team decimal odds
 * @param {number} drawOdds - Draw decimal odds
 * @param {number} awayOdds - Away team decimal odds
 * @returns {object} - Fair odds without margin
 */
export const removeVig = (homeOdds, drawOdds, awayOdds) => {
  const homeProb = 1 / homeOdds;
  const drawProb = 1 / drawOdds;
  const awayProb = 1 / awayOdds;

  const totalProb = homeProb + drawProb + awayProb;
  const margin = totalProb - 1;

  return {
    homeOdds: parseFloat((1 / (homeProb / totalProb)).toFixed(2)),
    drawOdds: parseFloat((1 / (drawProb / totalProb)).toFixed(2)),
    awayOdds: parseFloat((1 / (awayProb / totalProb)).toFixed(2)),
    margin: parseFloat((margin * 100).toFixed(2))
  };
};

/**
 * Format odds for display
 * @param {number} decimalOdds - Decimal odds
 * @param {string} format - 'decimal' | 'fractional' | 'american'
 * @returns {string} - Formatted odds string
 */
export const formatOdds = (decimalOdds, format = 'decimal') => {
  switch (format) {
    case 'fractional':
      return decimalToFractional(decimalOdds);
    case 'american':
      return decimalToAmerican(decimalOdds);
    default:
      return decimalOdds.toFixed(2);
  }
};
