/**
 * Division System Module
 * Handles baseball-style division categorization
 */

const Divisions = {
  /**
   * Division definitions
   */
  DIVISIONS: {
    D1: {
      name: 'D1',
      fullName: 'Division 1',
      color: '#002D62',
      accent: '#BA0C2F',
      requirements: 'Full starting 5 + 1+ bench',
      minStarters: 5,
      minBench: 1,
      description: 'Elite teams with complete rosters'
    },
    D2: {
      name: 'D2',
      fullName: 'Division 2',
      color: '#C41E3A',
      accent: '#FFFFFF',
      requirements: 'At least 1 player',
      minPlayers: 1,
      description: 'Competitive teams building their roster'
    },
    D3: {
      name: 'D3',
      fullName: 'Division 3',
      color: '#00843D',
      accent: '#FFD700',
      requirements: 'Incomplete roster',
      minPlayers: 1,
      description: 'Developing teams with incomplete lineups'
    },
    NAIA: {
      name: 'NAIA',
      fullName: 'NAIA',
      color: '#8B8B8B',
      accent: '#FFFFFF',
      requirements: 'No players',
      description: 'Empty teams waiting for players'
    }
  },

  /**
   * Categorize team into division
   * @param {object} teamStats - Team statistics
   * @returns {object} Division info
   */
  categorizeTeam(teamStats) {
    const { startersCount, benchCount, totalPlayers } = teamStats;

    // D1: Full starting 5 + at least 1 bench
    if (startersCount === 5 && benchCount >= 1) {
      return { ...this.DIVISIONS.D1, level: 1 };
    }

    // NAIA: No players
    if (totalPlayers === 0) {
      return { ...this.DIVISIONS.NAIA, level: 4 };
    }

    // D2: Has full starting 5 OR has at least 4 players total
    if (startersCount === 5 || totalPlayers >= 4) {
      return { ...this.DIVISIONS.D2, level: 2 };
    }

    // D3: Has at least 1 player (incomplete roster)
    if (totalPlayers >= 1) {
      return { ...this.DIVISIONS.D3, level: 3 };
    }

    // Fallback to NAIA
    return { ...this.DIVISIONS.NAIA, level: 4 };
  },

  /**
   * Get all teams with their divisions
   * @param {string} groupId - Group ID
   * @returns {Promise<object>} Teams grouped by division
   */
  async getTeamsByDivision(groupId) {
    const teams = await Teams.getByGroup(groupId);
    
    const divisions = {
      D1: [],
      D2: [],
      D3: [],
      NAIA: []
    };

    for (const team of teams) {
      const stats = await Teams.getStats(team.teamId);
      const division = this.categorizeTeam(stats);
      
      divisions[division.name].push({
        ...team,
        stats,
        division
      });
    }

    return divisions;
  },

  /**
   * Get division standings
   * @param {string} groupId - Group ID
   * @returns {Promise<Array>} Standings by division
   */
  async getStandings(groupId) {
    const divisionTeams = await this.getTeamsByDivision(groupId);
    
    const standings = [];

    // Add each division's teams
    ['D1', 'D2', 'D3', 'NAIA'].forEach(divName => {
      const teamsInDiv = divisionTeams[divName];
      
      // Sort by average overall rating (descending)
      teamsInDiv.sort((a, b) => b.stats.avgOverall - a.stats.avgOverall);

      teamsInDiv.forEach((team, index) => {
        standings.push({
          rank: standings.length + 1,
          divisionRank: index + 1,
          division: team.division,
          team,
          stats: team.stats
        });
      });
    });

    return standings;
  },

  /**
   * Get division summary
   * @param {string} groupId - Group ID
   * @returns {Promise<object>} Division summary
   */
  async getSummary(groupId) {
    const divisionTeams = await this.getTeamsByDivision(groupId);
    
    const summary = {
      totalTeams: 0,
      divisions: {}
    };

    Object.keys(this.DIVISIONS).forEach(divName => {
      const teams = divisionTeams[divName];
      summary.totalTeams += teams.length;
      
      summary.divisions[divName] = {
        ...this.DIVISIONS[divName],
        teamCount: teams.length,
        teams: teams.map(t => ({
          teamId: t.teamId,
          teamName: t.teamName,
          totalPlayers: t.stats.totalPlayers,
          avgOverall: t.stats.avgOverall
        }))
      };
    });

    return summary;
  },

  /**
   * Get next division for team
   * @param {object} currentDivision - Current division
   * @returns {object|null} Next division or null if at top
   */
  getNextDivision(currentDivision) {
    const order = ['NAIA', 'D3', 'D2', 'D1'];
    const currentIndex = order.indexOf(currentDivision.name);
    
    if (currentIndex > 0) {
      const nextDivName = order[currentIndex - 1];
      return { ...this.DIVISIONS[nextDivName], level: currentIndex };
    }
    
    return null; // Already at D1
  },

  /**
   * Get requirements to reach next division
   * @param {object} teamStats - Team statistics
   * @returns {object} Requirements info
   */
  getPromotionRequirements(teamStats) {
    const currentDivision = this.categorizeTeam(teamStats);
    const nextDivision = this.getNextDivision(currentDivision);
    
    if (!nextDivision) {
      return {
        isTopDivision: true,
        message: 'Already in top division (D1)'
      };
    }

    const { startersCount, benchCount, totalPlayers } = teamStats;
    const requirements = [];

    if (currentDivision.name === 'NAIA') {
      requirements.push('Add at least 1 player');
    } else if (currentDivision.name === 'D3') {
      const startersNeeded = Math.max(0, 5 - startersCount);
      if (startersNeeded > 0) {
        requirements.push(`Add ${startersNeeded} more starter${startersNeeded > 1 ? 's' : ''}`);
      } else {
        requirements.push('Move players to starting lineup');
      }
    } else if (currentDivision.name === 'D2') {
      if (startersCount < 5) {
        requirements.push(`Add ${5 - startersCount} more starter${5 - startersCount > 1 ? 's' : ''}`);
      }
      if (benchCount < 1) {
        requirements.push('Add at least 1 bench player');
      }
    }

    return {
      isTopDivision: false,
      currentDivision,
      nextDivision,
      requirements,
      message: requirements.join(' and ')
    };
  },

  /**
   * Get division badge HTML
   * @param {object} division - Division object
   * @param {boolean} showFullName - Show full name
   * @returns {string} HTML string
   */
  getDivisionBadge(division, showFullName = false) {
    return `
      <span class="division-badge division-${division.name.toLowerCase()}" 
            style="background-color: ${division.color}; border-color: ${division.accent};">
        <span class="division-name">${showFullName ? division.fullName : division.name}</span>
      </span>
    `;
  },

  /**
   * Get division color scheme
   * @param {string} divisionName - Division name
   * @returns {object} Color scheme
   */
  getColorScheme(divisionName) {
    const division = this.DIVISIONS[divisionName];
    return {
      primary: division.color,
      accent: division.accent
    };
  }
};

// Make Divisions available globally
window.Divisions = Divisions;
