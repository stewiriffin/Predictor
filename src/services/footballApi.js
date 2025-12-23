/**
 * Football Data API Service
 * Enhanced with retry logic, circuit breaker, and comprehensive error handling
 */

const API_BASE = '/api/v4';

// Circuit Breaker Configuration
const CIRCUIT_BREAKER = {
  failures: 0,
  threshold: 3,
  timeout: 30000, // 30 seconds
  lastFailureTime: null,
  state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};

// Retry Configuration
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000
};

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
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );
  return delay + Math.random() * 1000; // Add jitter
};

/**
 * Check if circuit breaker is open
 */
const isCircuitOpen = () => {
  if (CIRCUIT_BREAKER.state === 'OPEN') {
    const timeSinceLastFailure = Date.now() - CIRCUIT_BREAKER.lastFailureTime;
    if (timeSinceLastFailure > CIRCUIT_BREAKER.timeout) {
      console.log('[CIRCUIT] Circuit breaker transitioning to HALF_OPEN');
      CIRCUIT_BREAKER.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }
  return false;
};

/**
 * Record API failure for circuit breaker
 */
const recordFailure = () => {
  CIRCUIT_BREAKER.failures++;
  CIRCUIT_BREAKER.lastFailureTime = Date.now();

  if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) {
    CIRCUIT_BREAKER.state = 'OPEN';
    console.warn(`[WARNING] Circuit breaker OPEN after ${CIRCUIT_BREAKER.failures} failures`);
  }
};

/**
 * Record API success for circuit breaker
 */
const recordSuccess = () => {
  CIRCUIT_BREAKER.failures = 0;
  CIRCUIT_BREAKER.state = 'CLOSED';
};

/**
 * Enhanced fetch with retry logic and circuit breaker
 */
async function fetchWithRetry(url, options = {}, retries = RETRY_CONFIG.maxRetries) {
  // Check circuit breaker
  if (isCircuitOpen()) {
    throw new Error('Circuit breaker is OPEN - API temporarily unavailable. Please try again in 30 seconds.');
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Handle different HTTP status codes
      if (response.status === 500) {
        throw new Error('API server error (500) - The football-data.org service is experiencing issues. Using fallback data.');
      }

      if (response.status === 503) {
        throw new Error('API service unavailable (503) - Server is temporarily down. Retrying...');
      }

      if (response.status === 429) {
        throw new Error('Rate limit exceeded (429) - Free tier allows 10 requests/minute. Please wait.');
      }

      if (response.status === 403) {
        throw new Error('Access forbidden (403) - API key invalid or endpoint requires paid subscription.');
      }

      if (response.status === 404) {
        throw new Error('Resource not found (404) - Competition or endpoint does not exist.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      // Success - reset circuit breaker
      recordSuccess();
      return await response.json();

    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429
      if (error.message.includes('403') || error.message.includes('404')) {
        recordFailure();
        throw error;
      }

      // Retry on server errors (5xx) and 503
      if (attempt < retries && (error.message.includes('500') || error.message.includes('503'))) {
        const delay = getRetryDelay(attempt);
        console.warn(`[RETRY] Attempt ${attempt + 1}/${retries} after ${Math.round(delay)}ms - ${error.message}`);
        await sleep(delay);
        continue;
      }

      // Last attempt failed
      recordFailure();
      throw error;
    }
  }

  recordFailure();
  throw lastError;
}

/**
 * Fetch upcoming matches for a competition
 */
export async function fetchMatches(competitionCode) {
  try {
    const data = await fetchWithRetry(
      `${API_BASE}/competitions/${competitionCode}/matches?status=SCHEDULED`
    );
    return data.matches || [];
  } catch (error) {
    console.error(`[ERROR] Failed to fetch matches for ${competitionCode}:`, error.message);

    if (error.message.includes('500') || error.message.includes('Circuit breaker')) {
      console.warn('[FALLBACK] Using fallback mode - API unavailable');
      return [];
    }

    throw error;
  }
}

/**
 * Fetch standings for a competition
 */
export async function fetchStandings(competitionCode) {
  try {
    const data = await fetchWithRetry(
      `${API_BASE}/competitions/${competitionCode}/standings`
    );
    return data.standings || [];
  } catch (error) {
    console.error(`[ERROR] Failed to fetch standings for ${competitionCode}:`, error.message);

    if (error.message.includes('500') || error.message.includes('Circuit breaker')) {
      console.warn('[FALLBACK] Standings unavailable - will use fallback stats');
      return [];
    }

    throw error;
  }
}

/**
 * Fetch matches for a specific team
 */
export async function fetchTeamMatches(teamId, limit = 5) {
  try {
    const data = await fetchWithRetry(
      `${API_BASE}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`
    );
    return data.matches || [];
  } catch (error) {
    console.error(`[ERROR] Failed to fetch team matches for ${teamId}:`, error.message);

    if (error.message.includes('500') || error.message.includes('Circuit breaker')) {
      console.warn('[FALLBACK] Team matches unavailable - continuing without historical data');
      return [];
    }

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

  if (match.isFallback) {
    console.log('[DATA] Using fallback data for demo match');
    const { generateFallbackTeamStats, getFallbackLeagueAverage } = await import('./fallbackData.js');

    homeStats = generateFallbackTeamStats(match.homeTeam, true);
    awayStats = generateFallbackTeamStats(match.awayTeam, false);
    leagueAverage = getFallbackLeagueAverage(competitionCode);
    usingFallback = true;

    return {
      match,
      homeStats,
      awayStats,
      leagueAverage,
      homeMatches: [],
      awayMatches: [],
      usingFallback
    };
  }

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
 * Uses Bundesliga matches endpoint (free tier accessible)
 */
export async function testConnection() {
  try {
    // Reset circuit breaker for connection test
    if (CIRCUIT_BREAKER.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - CIRCUIT_BREAKER.lastFailureTime;
      if (timeSinceLastFailure > CIRCUIT_BREAKER.timeout) {
        CIRCUIT_BREAKER.state = 'HALF_OPEN';
        CIRCUIT_BREAKER.failures = Math.max(0, CIRCUIT_BREAKER.failures - 1);
      }
    }

    // Test with a known free-tier endpoint
    await fetchWithRetry(
      `${API_BASE}/competitions/BL1/matches?status=SCHEDULED&limit=1`,
      {},
      1 // Only 1 retry for connection test
    );

    return {
      success: true,
      message: 'CONNECTED'
    };
  } catch (error) {
    let errorMessage = error.message;

    // Provide user-friendly error messages
    if (error.message.includes('500')) {
      errorMessage = 'Server Error (API Down)';
    } else if (error.message.includes('503')) {
      errorMessage = 'Service Unavailable';
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate Limit Exceeded';
    } else if (error.message.includes('403')) {
      errorMessage = 'Invalid API Key';
    } else if (error.message.includes('Circuit breaker')) {
      errorMessage = 'Too Many Failures - Retry in 30s';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network Error';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get circuit breaker status (for debugging)
 */
export function getCircuitBreakerStatus() {
  return {
    state: CIRCUIT_BREAKER.state,
    failures: CIRCUIT_BREAKER.failures,
    lastFailureTime: CIRCUIT_BREAKER.lastFailureTime
  };
}
