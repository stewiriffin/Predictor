/**
 * ProMatch Predictor - API Service for football-data.org
 *
 * This service handles all API interactions with football-data.org
 * Free tier: 10 requests/minute, rate limiting enforced
 *
 * Get your API key: https://www.football-data.org/client/register
 */

const API_BASE_URL = 'https://api.football-data.org/v4';

// Use environment variable for API key
const API_KEY = import.meta.env.VITE_API_KEY || 'YOUR_KEY_HERE';

/**
 * League/Competition codes for football-data.org
 */
export const LEAGUES = {
  PREMIER_LEAGUE: {
    code: 'PL',
    id: 2021,
    name: 'Premier League',
    country: 'England',
    emblem: 'ENG'
  },
  LA_LIGA: {
    code: 'PD',
    id: 2014,
    name: 'La Liga',
    country: 'Spain',
    emblem: 'ESP'
  },
  BUNDESLIGA: {
    code: 'BL1',
    id: 2002,
    name: 'Bundesliga',
    country: 'Germany',
    emblem: 'GER'
  },
  SERIE_A: {
    code: 'SA',
    id: 2019,
    name: 'Serie A',
    country: 'Italy',
    emblem: 'ITA'
  },
  CHAMPIONS_LEAGUE: {
    code: 'CL',
    id: 2001,
    name: 'Champions League',
    country: 'Europe',
    emblem: 'UCL'
  }
};

/**
 * Create API headers
 */
const getHeaders = () => ({
  'X-Auth-Token': API_KEY,
  'Content-Type': 'application/json'
});

/**
 * Fetch upcoming matches for a competition
 * @param {string} competitionCode - Competition code (e.g., 'PL', 'PD')
 * @returns {Promise} - Matches data
 */
export const getUpcomingMatches = async (competitionCode) => {
  const url = `${API_BASE_URL}/competitions/${competitionCode}/matches?status=SCHEDULED`;

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch matches`);
  }

  const data = await response.json();
  return data.matches || [];
};

/**
 * Fetch standings for a competition (used for team statistics)
 * @param {string} competitionCode - Competition code
 * @returns {Promise} - Standings data
 */
export const getStandings = async (competitionCode) => {
  const url = `${API_BASE_URL}/competitions/${competitionCode}/standings`;

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch standings`);
  }

  const data = await response.json();
  return data.standings;
};

/**
 * Fetch team information
 * @param {number} teamId - Team ID
 * @returns {Promise} - Team data
 */
export const getTeam = async (teamId) => {
  const url = `${API_BASE_URL}/teams/${teamId}`;

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team data`);
  }

  const data = await response.json();
  return data;
};

/**
 * Fetch matches for a specific team
 * @param {number} teamId - Team ID
 * @param {number} limit - Number of matches to fetch
 * @returns {Promise} - Matches data
 */
export const getTeamMatches = async (teamId, limit = 10) => {
  const url = `${API_BASE_URL}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team matches`);
  }

  const data = await response.json();
  return data.matches || [];
};

/**
 * Fetch head-to-head data between two teams
 * @param {number} matchId - Match ID
 * @returns {Promise} - Head-to-head data
 */
export const getHeadToHead = async (matchId) => {
  const url = `${API_BASE_URL}/matches/${matchId}/head2head?limit=10`;

  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    // H2H might not be available for all matches
    return null;
  }

  const data = await response.json();
  return data;
};

/**
 * Extract team statistics from standings data
 * @param {array} standings - Standings array
 * @param {number} teamId - Team ID
 * @returns {object} - Team statistics
 */
export const extractTeamStats = (standings, teamId) => {
  if (!standings || !standings[0] || !standings[0].table) {
    return null;
  }

  const team = standings[0].table.find(entry => entry.team.id === teamId);

  if (!team) return null;

  return {
    name: team.team.name,
    position: team.position,
    playedGames: team.playedGames,
    won: team.won,
    draw: team.draw,
    lost: team.lost,
    points: team.points,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDifference: team.goalDifference,
    form: team.form || null,
    // Calculated stats for Poisson model
    goalsScored: team.goalsFor,
    goalsConceded: team.goalsAgainst,
    matchesPlayed: team.playedGames
  };
};

/**
 * Calculate league average goals from standings
 * @param {array} standings - Standings array
 * @returns {number} - Average goals per game
 */
export const calculateLeagueAverage = (standings) => {
  if (!standings || !standings[0] || !standings[0].table) {
    return 1.5; // Default fallback
  }

  const table = standings[0].table;
  const totalGoals = table.reduce((sum, team) => sum + team.goalsFor, 0);
  const totalMatches = table.reduce((sum, team) => sum + team.playedGames, 0);

  if (totalMatches === 0) return 1.5;

  return totalGoals / totalMatches;
};

/**
 * Comprehensive data fetch for match prediction
 * Uses the caching hook for optimal performance
 *
 * @param {object} match - Match object from API
 * @param {string} competitionCode - Competition code
 * @returns {object} - All data needed for prediction
 */
export const getMatchPredictionData = async (match, competitionCode) => {
  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  try {
    // Fetch standings to get team statistics
    const standings = await getStandings(competitionCode);

    // Extract team stats from standings
    const homeStats = extractTeamStats(standings, homeTeamId);
    const awayStats = extractTeamStats(standings, awayTeamId);

    // Calculate league average
    const leagueAverage = calculateLeagueAverage(standings);

    // Fetch recent matches for form analysis
    const [homeMatches, awayMatches] = await Promise.all([
      getTeamMatches(homeTeamId, 5),
      getTeamMatches(awayTeamId, 5)
    ]);

    // Try to fetch H2H data (may not always be available)
    let h2hData = null;
    try {
      h2hData = await getHeadToHead(match.id);
    } catch (err) {
      console.warn('H2H data not available:', err);
    }

    return {
      match,
      homeStats,
      awayStats,
      leagueAverage,
      homeMatches,
      awayMatches,
      h2hData
    };
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    throw error;
  }
};

/**
 * Parse form string into result array
 * @param {string} form - Form string (e.g., "WWDLW")
 * @returns {array} - Array of results
 */
export const parseForm = (form) => {
  if (!form) return [];

  return form.split('').map(result => {
    if (result === 'W') return 'win';
    if (result === 'D') return 'draw';
    if (result === 'L') return 'loss';
    return null;
  }).filter(Boolean);
};

/**
 * Check API key validity
 * @returns {Promise<boolean>} - True if API key is valid
 */
export const checkApiKey = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/competitions/PL`, {
      headers: getHeaders()
    });

    return response.ok;
  } catch (err) {
    return false;
  }
};

export default {
  getUpcomingMatches,
  getStandings,
  getTeam,
  getTeamMatches,
  getHeadToHead,
  getMatchPredictionData,
  extractTeamStats,
  calculateLeagueAverage,
  parseForm,
  checkApiKey
};
