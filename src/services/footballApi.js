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
