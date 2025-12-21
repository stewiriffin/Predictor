/**
 * Football Data API Service
 * Clean implementation for football-data.org API v4
 */

const API_BASE = '/api/v4';

/**
 * Available competitions
 */
export const COMPETITIONS = {
  // Free tier competitions (try these first)
  WORLD_CUP: { code: 'WC', name: 'FIFA World Cup', tier: 'TIER_ONE' },
  CHAMPIONS_LEAGUE: { code: 'CL', name: 'UEFA Champions League', tier: 'TIER_ONE' },
  BUNDESLIGA: { code: 'BL1', name: 'Bundesliga', tier: 'TIER_TWO' },
  EREDIVISIE: { code: 'DED', name: 'Eredivisie', tier: 'TIER_TWO' },
  SERIE_A: { code: 'SA', name: 'Serie A', tier: 'TIER_TWO' },
  LIGUE_1: { code: 'FL1', name: 'Ligue 1', tier: 'TIER_TWO' },

  // Paid tier (may not work with free API key)
  PREMIER_LEAGUE: { code: 'PL', name: 'Premier League', tier: 'TIER_ONE' },
  LA_LIGA: { code: 'PD', name: 'La Liga', tier: 'TIER_ONE' }
};

/**
 * Fetch upcoming matches for a competition
 */
export async function fetchMatches(competitionCode) {
  try {
    const response = await fetch(
      `${API_BASE}/competitions/${competitionCode}/matches?status=SCHEDULED`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error(`Failed to fetch matches for ${competitionCode}:`, error);
    throw error;
  }
}

/**
 * Fetch standings for a competition
 */
export async function fetchStandings(competitionCode) {
  try {
    const response = await fetch(
      `${API_BASE}/competitions/${competitionCode}/standings`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.standings || [];
  } catch (error) {
    console.error(`Failed to fetch standings for ${competitionCode}:`, error);
    throw error;
  }
}

/**
 * Fetch matches for a specific team
 */
export async function fetchTeamMatches(teamId, limit = 5) {
  try {
    const response = await fetch(
      `${API_BASE}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error(`Failed to fetch team matches for ${teamId}:`, error);
    throw error;
  }
}

/**
 * Extract team stats from standings
 */
function extractTeamStats(standings, teamId) {
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
    goalsScored: team.goalsFor,
    goalsConceded: team.goalsAgainst,
    matchesPlayed: team.playedGames
  };
}

/**
 * Calculate league average goals
 */
function calculateLeagueAverage(standings) {
  if (!standings || !standings[0] || !standings[0].table) {
    return 1.5;
  }

  const table = standings[0].table;
  const totalGoals = table.reduce((sum, team) => sum + team.goalsFor, 0);
  const totalMatches = table.reduce((sum, team) => sum + team.playedGames, 0);

  if (totalMatches === 0) return 1.5;
  return totalGoals / totalMatches;
}

/**
 * Parse form string into result array
 */
function parseForm(form) {
  if (!form) return [];

  return form.split('').map(result => {
    if (result === 'W') return 'win';
    if (result === 'D') return 'draw';
    if (result === 'L') return 'loss';
    return null;
  }).filter(Boolean);
}

/**
 * Create fallback team stats when API data is unavailable
 */
function createFallbackStats(team) {
  return {
    name: team.name,
    position: 10,
    playedGames: 15,
    won: 7,
    draw: 4,
    lost: 4,
    points: 25,
    goalsFor: 22,
    goalsAgainst: 18,
    goalDifference: 4,
    form: 'WDLWW',
    goalsScored: 22,
    goalsConceded: 18,
    matchesPlayed: 15,
    recentForm: ['win', 'win', 'loss', 'draw', 'win']
  };
}

/**
 * Fetch comprehensive match prediction data
 * This includes standings, team stats, recent matches, and league averages
 * Falls back to estimated data if API tier doesn't allow access
 */
export async function getMatchPredictionData(match, competitionCode) {
  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  let homeStats = null;
  let awayStats = null;
  let leagueAverage = 1.5;
  let homeMatches = [];
  let awayMatches = [];
  let usingFallback = false;

  try {
    // Try to fetch standings
    const standings = await fetchStandings(competitionCode);

    // Extract team stats
    homeStats = extractTeamStats(standings, homeTeamId);
    awayStats = extractTeamStats(standings, awayTeamId);

    // Calculate league average
    leagueAverage = calculateLeagueAverage(standings);

    // Add form data to stats
    if (homeStats && homeStats.form) {
      homeStats.recentForm = parseForm(homeStats.form);
    }
    if (awayStats && awayStats.form) {
      awayStats.recentForm = parseForm(awayStats.form);
    }
  } catch (error) {
    console.warn('Standings not available (API tier restriction), using fallback data:', error.message);
    usingFallback = true;
  }

  // If standings failed or data missing, use fallback
  if (!homeStats || !awayStats) {
    console.warn('Using fallback team statistics');
    homeStats = homeStats || createFallbackStats(match.homeTeam);
    awayStats = awayStats || createFallbackStats(match.awayTeam);
    usingFallback = true;
  }

  // Try to fetch team matches (optional, don't fail if unavailable)
  try {
    const matches = await Promise.all([
      fetchTeamMatches(homeTeamId, 5).catch(() => []),
      fetchTeamMatches(awayTeamId, 5).catch(() => [])
    ]);
    homeMatches = matches[0];
    awayMatches = matches[1];
  } catch (error) {
    console.warn('Team matches not available:', error.message);
  }

  return {
    match,
    homeStats,
    awayStats,
    leagueAverage,
    homeMatches,
    awayMatches,
    usingFallback
  };
}

/**
 * Test API connection
 */
export async function testConnection() {
  try {
    const response = await fetch(`${API_BASE}/competitions`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return {
        success: false,
        error: error.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      competitions: data.competitions || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
