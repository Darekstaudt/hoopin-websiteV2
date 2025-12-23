/**
 * Team Operations
 * CRUD operations for teams with triple-layer persistence
 */

class TeamManager {
  /**
   * Create new team
   */
  async createTeam(teamData) {
    try {
      const teamId = generateId('team');
      
      // Compress team photo if provided
      let teamPhoto = teamData.teamPhoto || '';
      if (teamPhoto && teamPhoto.length > 1000) {
        try {
          teamPhoto = await imageOptimizer.compressBase64(teamPhoto);
        } catch (e) {
          console.warn('Photo compression failed, using original');
        }
      }
      
      const team = {
        teamId,
        teamName: teamData.teamName,
        teamPhoto,
        manager: teamData.manager || 'Anonymous',
        groupId: teamData.groupId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        roster: {
          starters: [],
          bench: []
        }
      };

      await dbManager.save('teams', teamId, team);
      
      // Add team to group
      if (teamData.groupId) {
        await groupManager.addTeamToGroup(teamData.groupId, teamId);
      }
      
      console.log('✅ Team created:', teamId);
      return { success: true, team };
    } catch (error) {
      console.error('❌ Create team error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId) {
    try {
      const team = await dbManager.get('teams', teamId);
      return team;
    } catch (error) {
      console.error('❌ Get team error:', error);
      return null;
    }
  }

  /**
   * Update team
   */
  async updateTeam(teamId, updates) {
    try {
      const team = await dbManager.get('teams', teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Compress team photo if updated
      if (updates.teamPhoto && updates.teamPhoto.length > 1000) {
        try {
          updates.teamPhoto = await imageOptimizer.compressBase64(updates.teamPhoto);
        } catch (e) {
          console.warn('Photo compression failed, using original');
        }
      }

      const updatedTeam = {
        ...team,
        ...updates,
        teamId, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      await dbManager.save('teams', teamId, updatedTeam);
      
      console.log('✅ Team updated:', teamId);
      return { success: true, team: updatedTeam };
    } catch (error) {
      console.error('❌ Update team error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId) {
    try {
      const team = await dbManager.get('teams', teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Delete all players in this team
      const players = await dbManager.query('players', player => player.teamId === teamId);
      for (const player of players) {
        await dbManager.delete('players', player.playerId);
      }

      // Remove team from group
      if (team.groupId) {
        await groupManager.removeTeamFromGroup(team.groupId, teamId);
      }

      // Delete the team
      await dbManager.delete('teams', teamId);
      
      console.log('✅ Team deleted:', teamId);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete team error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all players in team
   */
  async getTeamPlayers(teamId) {
    try {
      const players = await dbManager.query('players', player => player.teamId === teamId);
      
      // Sort by overall rating (descending)
      players.sort((a, b) => b.overall - a.overall);
      
      return players;
    } catch (error) {
      console.error('❌ Get team players error:', error);
      return [];
    }
  }

  /**
   * Get team roster (organized by position)
   */
  async getTeamRoster(teamId) {
    try {
      const team = await dbManager.get('teams', teamId);
      
      if (!team) {
        return { starters: [], bench: [] };
      }

      const players = await this.getTeamPlayers(teamId);
      
      // Sort by overall descending
      players.sort((a, b) => {
        const aRating = ratingsCalculator.calculatePlayerRatings(a.stats, a.capBreakers);
        const bRating = ratingsCalculator.calculatePlayerRatings(b.stats, b.capBreakers);
        return bRating.overall - aRating.overall;
      });
      
      const starters = [];
      const bench = [];

      // AUTO-ASSIGN: Top 5 players go to Starting 5, rest to Bench
      players.forEach((player, index) => {
        if (index < 5) {
          starters.push(player);
        } else {
          bench.push(player);
        }
      });

      // Update team roster in database
      team.roster = {
        starters: starters.map(p => p.playerId),
        bench: bench.map(p => p.playerId)
      };
      await dbManager.save('teams', teamId, team);

      return { starters, bench };
    } catch (error) {
      console.error('❌ Get team roster error:', error);
      return { starters: [], bench: [] };
    }
  }

  /**
   * Update team roster positions
   */
  async updateRoster(teamId, starters, bench) {
    try {
      const team = await dbManager.get('teams', teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      team.roster = {
        starters: starters.map(p => p.playerId || p),
        bench: bench.map(p => p.playerId || p)
      };

      await dbManager.save('teams', teamId, team);
      
      console.log('✅ Roster updated:', teamId);
      return { success: true };
    } catch (error) {
      console.error('❌ Update roster error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get team stats
   */
  async getTeamStats(teamId) {
    try {
      const players = await this.getTeamPlayers(teamId);
      const { starters, bench } = await this.getTeamRoster(teamId);

      const totalPlayers = players.length;
      const startersCount = starters.length;
      const benchCount = bench.length;

      const avgOverall = totalPlayers > 0
        ? Math.round(players.reduce((sum, p) => sum + p.overall, 0) / totalPlayers)
        : 0;

      const topPlayer = players.length > 0 ? players[0] : null;

      return {
        totalPlayers,
        startersCount,
        benchCount,
        avgOverall,
        topPlayer
      };
    } catch (error) {
      console.error('❌ Get team stats error:', error);
      return {
        totalPlayers: 0,
        startersCount: 0,
        benchCount: 0,
        avgOverall: 0,
        topPlayer: null
      };
    }
  }

  /**
   * Get all teams in group
   */
  async getTeamsByGroup(groupId) {
    try {
      const teams = await dbManager.query('teams', team => team.groupId === groupId);
      
      // Sort by creation date
      teams.sort((a, b) => b.createdAt - a.createdAt);
      
      return teams;
    } catch (error) {
      console.error('❌ Get teams by group error:', error);
      return [];
    }
  }

  /**
   * Get all teams
   */
  async getAllTeams() {
    try {
      return await dbManager.getAll('teams');
    } catch (error) {
      console.error('❌ Get all teams error:', error);
      return [];
    }
  }

  /**
   * Search teams
   */
  async searchTeams(query, groupId = null) {
    try {
      let teams = groupId 
        ? await this.getTeamsByGroup(groupId)
        : await this.getAllTeams();

      if (!query) return teams;

      query = query.toLowerCase();
      return teams.filter(team => 
        team.teamName.toLowerCase().includes(query) ||
        team.manager.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('❌ Search teams error:', error);
      return [];
    }
  }

  /**
   * Check if team name exists in group
   */
  async teamNameExists(teamName, groupId) {
    try {
      const teams = await this.getTeamsByGroup(groupId);
      return teams.some(team => 
        team.teamName.toLowerCase() === teamName.toLowerCase()
      );
    } catch (error) {
      console.error('❌ Team name check error:', error);
      return false;
    }
  }
}

// Create global instance
const teamManager = new TeamManager();
