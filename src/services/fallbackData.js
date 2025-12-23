/**
 * Fallback Data for API Outages
 * Provides realistic sample matches when football-data.org API is unavailable
 */

/**
 * Generate realistic fallback matches for different competitions
 */
export const generateFallbackMatches = (competitionCode) => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 3); // 3 days from now

  const competitions = {
    'BL1': {
      name: 'Bundesliga',
      teams: [
        { id: 5, name: 'FC Bayern München', shortName: 'Bayern', crest: '' },
        { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', crest: '' },
        { id: 11, name: 'VfL Wolfsburg', shortName: 'Wolfsburg', crest: '' },
        { id: 18, name: 'Bayer 04 Leverkusen', shortName: 'Leverkusen', crest: '' },
        { id: 15, name: 'Borussia Mönchengladbach', shortName: "M'gladbach", crest: '' },
        { id: 16, name: 'FC Schalke 04', shortName: 'Schalke', crest: '' }
      ]
    },
    'PL': {
      name: 'Premier League',
      teams: [
        { id: 65, name: 'Manchester City FC', shortName: 'Man City', crest: '' },
        { id: 64, name: 'Liverpool FC', shortName: 'Liverpool', crest: '' },
        { id: 61, name: 'Chelsea FC', shortName: 'Chelsea', crest: '' },
        { id: 57, name: 'Arsenal FC', shortName: 'Arsenal', crest: '' },
        { id: 66, name: 'Manchester United FC', shortName: 'Man United', crest: '' },
        { id: 73, name: 'Tottenham Hotspur FC', shortName: 'Spurs', crest: '' }
      ]
    },
    'PD': {
      name: 'La Liga',
      teams: [
        { id: 81, name: 'FC Barcelona', shortName: 'Barcelona', crest: '' },
        { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', crest: '' },
        { id: 78, name: 'Atlético Madrid', shortName: 'Atlético', crest: '' },
        { id: 90, name: 'Real Sociedad', shortName: 'Sociedad', crest: '' },
        { id: 95, name: 'Valencia CF', shortName: 'Valencia', crest: '' },
        { id: 94, name: 'Villarreal CF', shortName: 'Villarreal', crest: '' }
      ]
    },
    'SA': {
      name: 'Serie A',
      teams: [
        { id: 98, name: 'AC Milan', shortName: 'Milan', crest: '' },
        { id: 108, name: 'Inter Milan', shortName: 'Inter', crest: '' },
        { id: 109, name: 'Juventus FC', shortName: 'Juventus', crest: '' },
        { id: 113, name: 'SSC Napoli', shortName: 'Napoli', crest: '' },
        { id: 99, name: 'AS Roma', shortName: 'Roma', crest: '' },
        { id: 110, name: 'Lazio Roma', shortName: 'Lazio', crest: '' }
      ]
    },
    'FL1': {
      name: 'Ligue 1',
      teams: [
        { id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', crest: '' },
        { id: 516, name: 'Olympique de Marseille', shortName: 'Marseille', crest: '' },
        { id: 523, name: 'Olympique Lyonnais', shortName: 'Lyon', crest: '' },
        { id: 511, name: 'AS Monaco FC', shortName: 'Monaco', crest: '' },
        { id: 512, name: 'OGC Nice', shortName: 'Nice', crest: '' },
        { id: 548, name: 'RC Lens', shortName: 'Lens', crest: '' }
      ]
    },
    'DED': {
      name: 'Eredivisie',
      teams: [
        { id: 678, name: 'Ajax Amsterdam', shortName: 'Ajax', crest: '' },
        { id: 674, name: 'PSV Eindhoven', shortName: 'PSV', crest: '' },
        { id: 675, name: 'Feyenoord Rotterdam', shortName: 'Feyenoord', crest: '' },
        { id: 676, name: 'FC Utrecht', shortName: 'Utrecht', crest: '' },
        { id: 677, name: 'AZ Alkmaar', shortName: 'AZ', crest: '' },
        { id: 679, name: 'FC Twente', shortName: 'Twente', crest: '' }
      ]
    }
  };

  const competition = competitions[competitionCode] || competitions['BL1'];
  const matches = [];

  // Generate 6 sample matches
  for (let i = 0; i < 6; i += 2) {
    const matchDate = new Date(baseDate);
    matchDate.setDate(matchDate.getDate() + Math.floor(i / 2));

    matches.push({
      id: 999000 + i,
      utcDate: matchDate.toISOString(),
      status: 'SCHEDULED',
      matchday: 20 + Math.floor(i / 2),
      homeTeam: competition.teams[i],
      awayTeam: competition.teams[i + 1],
      competition: {
        name: competition.name,
        emblem: ''
      },
      isFallback: true
    });
  }

  return matches;
};

/**
 * Generate fallback team stats
 */
export const generateFallbackTeamStats = (team, isHome = true) => {
  // Create realistic but varied stats
  const seed = team.id || 1;
  const baseWins = 8 + (seed % 10);
  const baseLosses = 4 + (seed % 5);
  const baseDraws = 3 + (seed % 4);

  const wins = isHome ? baseWins + 2 : baseWins;
  const losses = isHome ? baseLosses - 1 : baseLosses + 1;
  const draws = baseDraws;
  const played = wins + losses + draws;

  const goalsFor = wins * 2 + draws + Math.floor(seed % 8);
  const goalsAgainst = losses * 2 + draws - Math.floor(seed % 3);

  // Generate realistic form (last 5 matches)
  const formResults = ['W', 'D', 'L'];
  const form = Array.from({ length: 5 }, (_, i) => {
    const index = (seed + i) % 3;
    return formResults[index];
  }).join('');

  return {
    name: team.name || team.shortName || 'Team',
    shortName: team.shortName || team.name || 'Team',
    position: 5 + (seed % 10),
    playedGames: played,
    won: wins,
    draw: draws,
    lost: losses,
    points: wins * 3 + draws,
    goalsFor: goalsFor,
    goalsAgainst: goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    form: form,
    goalsScored: goalsFor,
    goalsConceded: goalsAgainst,
    matchesPlayed: played,
    recentForm: form.split('').map(r => {
      if (r === 'W') return 'win';
      if (r === 'D') return 'draw';
      return 'loss';
    }),
    isFallback: true
  };
};

/**
 * Get fallback league average
 */
export const getFallbackLeagueAverage = (competitionCode) => {
  // Different leagues have different scoring patterns
  const averages = {
    'BL1': 1.55, // Bundesliga - high scoring
    'PL': 1.45,  // Premier League
    'PD': 1.35,  // La Liga - lower scoring
    'SA': 1.40,  // Serie A
    'FL1': 1.42, // Ligue 1
    'DED': 1.65  // Eredivisie - very high scoring
  };

  return averages[competitionCode] || 1.5;
};
