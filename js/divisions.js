/**
 * Division Logic
 * Baseball-style division system based on roster completion
 * 
 * D1 (Navy #002D62, Red accent #BA0C2F): Full starting 5 + 1+ bench
 * D2 (Cardinal Red #C41E3A, White accent): At least 1 player
 * D3 (Forest Green #00843D, Gold accent): At least 1 player (incomplete roster)
 * NAIA (Gray #8B8B8B): Zero players
 */

const DIVISIONS = {
  D1: {
    name: 'D1',
    fullName: 'Division I',
    description: 'Full starting 5 + 1+ body',
    color: '#002D62',
    accentColor: '#BA0C2F',
    minStarters: 5,
    minBench: 1,
    icon: '🏆',
    tier: 1
  },
  D2: {
    name: 'D2',
    fullName: 'Division II',
    description: 'At least 1 player + 1+ body',
    color: '#C41E3A',
    accentColor: '#FFFFFF',
    minStarters: 5,
    minBench: 0,
    icon: '🥈',
    tier: 2
  },
  D3: {
    name: 'D3',
    fullName: 'Division III',
    description: 'At least 1 player',
    color: '#00843D',
    accentColor: '#FFD700',
    minStarters: 1,
    minBench: 0,
    icon: '🥉',
    tier: 3
  },
  NAIA: {
    name: 'NAIA',
    fullName: 'NAIA',
    description: 'No players yet',
    color: '#8B8B8B',
    accentColor: '#CCCCCC',
    minStarters: 0,
    minBench: 0,
    icon: '📋',
    tier: 4
  }
};

class DivisionManager {
  /**
   * Calculate team's division based on roster
   */
  async calculateTeamDivision(teamId) {
    try {
      const players = await teamManager.getTeamPlayers(teamId);
      const totalPlayers = players.length;
      const bodyCount = players.filter(p => p.isBody === true).length;
      const { starters } = await teamManager.getTeamRoster(teamId);
      const startersCount = starters.length;
      
      let divisionName;
      
      // NEW DIVISION RULES:
      // D1: Must have 5 players in starting lineup + at least 1 body
      // D2: Must have at least 1 player + at least 1 body
      // D3: Must have at least 1 player
      // NAIA: Zero players on team roster
      
      if (startersCount >= 5 && bodyCount >= 1) {
        divisionName = 'D1';
      } else if (totalPlayers >= 1 && bodyCount >= 1) {
        divisionName = 'D2';
      } else if (totalPlayers >= 1) {
        divisionName = 'D3';
      } else {
        divisionName = 'NAIA';
      }
      
      return DIVISIONS[divisionName];
    } catch (error) {
      console.error('❌ Calculate team division error:', error);
      return DIVISIONS.NAIA;
    }
  }

  /**
   * Get all teams by division
   */
  async getTeamsByDivision(groupId = null) {
    try {
      const teams = groupId 
        ? await teamManager.getTeamsByGroup(groupId)
        : await teamManager.getAllTeams();

      const divisionTeams = {
        D1: [],
        D2: [],
        D3: [],
        NAIA: []
      };

      for (const team of teams) {
        const division = await this.calculateTeamDivision(team.teamId);
        const stats = await teamManager.getTeamStats(team.teamId);
        
        divisionTeams[division.name].push({
          ...team,
          division: division.name,
          stats
        });
      }

      // Sort each division by average overall rating
      for (const divisionName in divisionTeams) {
        divisionTeams[divisionName].sort((a, b) => 
          b.stats.avgOverall - a.stats.avgOverall
        );
      }

      return divisionTeams;
    } catch (error) {
      console.error('❌ Get teams by division error:', error);
      return { D1: [], D2: [], D3: [], NAIA: [] };
    }
  }

  /**
   * Get division standings
   */
  async getDivisionStandings(groupId = null) {
    try {
      const divisionTeams = await this.getTeamsByDivision(groupId);

      const standings = [];

      for (const divisionName of ['D1', 'D2', 'D3', 'NAIA']) {
        const division = DIVISIONS[divisionName];
        const teams = divisionTeams[divisionName];

        standings.push({
          division,
          teams,
          count: teams.length,
          avgRating: teams.length > 0
            ? Math.round(teams.reduce((sum, t) => sum + t.stats.avgOverall, 0) / teams.length)
            : 0
        });
      }

      return standings;
    } catch (error) {
      console.error('❌ Get division standings error:', error);
      return [];
    }
  }

  /**
   * Get team's division info
   */
  async getTeamDivisionInfo(teamId) {
    try {
      const division = await this.calculateTeamDivision(teamId);
      const players = await teamManager.getTeamPlayers(teamId);
      const { starters, bench } = await teamManager.getTeamRoster(teamId);
      
      const startersCount = starters.length;
      const benchCount = bench.length;
      const totalPlayers = players.length;
      const bodyCount = players.filter(p => p.isBody === true).length;
      
      let nextDivision = null;
      let playersNeeded = 0;

      if (division.name === 'NAIA') {
        nextDivision = DIVISIONS.D3;
        playersNeeded = 1;
      } else if (division.name === 'D3') {
        // Need at least 1 body to reach D2
        nextDivision = DIVISIONS.D2;
        playersNeeded = bodyCount >= 1 ? 0 : 1;
      } else if (division.name === 'D2') {
        // Need 5 starters to reach D1 (already have at least 1 body)
        nextDivision = DIVISIONS.D1;
        playersNeeded = Math.max(0, 5 - startersCount);
      }

      return {
        division,
        nextDivision,
        playersNeeded,
        startersCount,
        benchCount,
        totalPlayers,
        bodyCount
      };
    } catch (error) {
      console.error('❌ Get team division info error:', error);
      return {
        division: DIVISIONS.NAIA,
        nextDivision: DIVISIONS.D3,
        playersNeeded: 1,
        startersCount: 0,
        benchCount: 0,
        totalPlayers: 0,
        bodyCount: 0
      };
    }
  }

  /**
   * Get division summary for group
   */
  async getDivisionSummary(groupId) {
    try {
      const divisionTeams = await this.getTeamsByDivision(groupId);

      const summary = {
        totalTeams: 0,
        byDivision: {}
      };

      for (const divisionName in divisionTeams) {
        const count = divisionTeams[divisionName].length;
        summary.totalTeams += count;
        summary.byDivision[divisionName] = count;
      }

      return summary;
    } catch (error) {
      console.error('❌ Get division summary error:', error);
      return {
        totalTeams: 0,
        byDivision: { D1: 0, D2: 0, D3: 0, NAIA: 0 }
      };
    }
  }

  /**
   * Get all division definitions
   */
  getAllDivisions() {
    return DIVISIONS;
  }

  /**
   * Get division by name
   */
  getDivision(name) {
    return DIVISIONS[name] || DIVISIONS.NAIA;
  }

  /**
   * Create division badge HTML
   */
  createDivisionBadge(divisionName, size = 'medium') {
    const division = this.getDivision(divisionName);
    
    return `
      <div class="division-badge division-${size}" 
           style="background-color: ${division.color}; border-color: ${division.accentColor}">
        <span class="division-icon">${division.icon}</span>
        <span class="division-name">${division.name}</span>
      </div>
    `;
  }

  /**
   * Get division color scheme
   */
  getDivisionColors(divisionName) {
    const division = this.getDivision(divisionName);
    return {
      primary: division.color,
      accent: division.accentColor
    };
  }

  /**
   * Check if team qualifies for division
   */
  async teamQualifiesForDivision(teamId, divisionName) {
    const currentDivision = await this.calculateTeamDivision(teamId);
    const targetDivision = this.getDivision(divisionName);
    
    return currentDivision.tier <= targetDivision.tier;
  }

  /**
   * Get promotion/relegation message
   */
  async getPromotionMessage(teamId) {
    const info = await this.getTeamDivisionInfo(teamId);
    
    if (!info.nextDivision) {
      return `🏆 Congratulations! Your team is in ${info.division.fullName}!`;
    }

    return `📈 Add ${info.playersNeeded} more ${info.playersNeeded === 1 ? 'player' : 'players'} to reach ${info.nextDivision.fullName}!`;
  }
}

// Create global instance
const divisionManager = new DivisionManager();
