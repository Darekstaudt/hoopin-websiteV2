/**
 * Team Management Module
 * Handles team creation, roster management, and operations
 */

const Teams = {
  /**
   * Create a new team
   * @param {string} teamName - Name of the team
   * @param {string} manager - Manager name
   * @param {string} groupId - Group ID
   * @param {string} teamPhoto - Team photo (base64)
   * @returns {Promise<object>} Created team
   */
  async create(teamName, manager, groupId, teamPhoto = null) {
    if (!teamName || !manager || !groupId) {
      throw new Error('Team name, manager, and group ID are required');
    }

    const teamId = Utils.generateId('team');

    const team = {
      teamId,
      teamName: teamName.trim(),
      manager: manager.trim(),
      groupId,
      teamPhoto,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      roster: {
        starters: [],
        bench: []
      }
    };

    await DBManager.save(DBManager.STORES.TEAMS, teamId, team);
    
    // Add team to group
    await Groups.addTeam(groupId, teamId);

    console.log('✅ Team created:', teamId);
    return team;
  },

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Team data
   */
  async get(teamId) {
    return await DBManager.get(DBManager.STORES.TEAMS, teamId);
  },

  /**
   * Get all teams
   * @returns {Promise<Array>} All teams
   */
  async getAll() {
    return await DBManager.getAll(DBManager.STORES.TEAMS);
  },

  /**
   * Get teams by group
   * @param {string} groupId - Group ID
   * @returns {Promise<Array>} Teams in group
   */
  async getByGroup(groupId) {
    return await DBManager.query(DBManager.STORES.TEAMS, 'groupId', groupId);
  },

  /**
   * Update team
   * @param {string} teamId - Team ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated team
   */
  async update(teamId, updates) {
    const team = await this.get(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    const updatedTeam = {
      ...team,
      ...updates,
      teamId, // Prevent ID change
      updatedAt: Date.now()
    };

    await DBManager.save(DBManager.STORES.TEAMS, teamId, updatedTeam);
    
    console.log('✅ Team updated:', teamId);
    return updatedTeam;
  },

  /**
   * Delete team
   * @param {string} teamId - Team ID
   */
  async delete(teamId) {
    const team = await this.get(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    // Delete all players in team
    const players = await this.getPlayers(teamId);
    for (const player of players) {
      await Players.delete(player.playerId);
    }

    // Remove team from group
    if (team.groupId) {
      await Groups.removeTeam(team.groupId, teamId);
    }

    // Delete team
    await DBManager.delete(DBManager.STORES.TEAMS, teamId);
    
    console.log('✅ Team deleted:', teamId);
  },

  /**
   * Add player to roster
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   * @param {string} position - Position ('starters' or 'bench')
   */
  async addPlayer(teamId, playerId, position = 'bench') {
    const team = await this.get(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    // Remove from both positions first (in case moving)
    team.roster.starters = team.roster.starters.filter(id => id !== playerId);
    team.roster.bench = team.roster.bench.filter(id => id !== playerId);

    // Add to specified position
    if (position === 'starters') {
      if (team.roster.starters.length >= 5) {
        throw new Error('Starting lineup is full (max 5 players)');
      }
      team.roster.starters.push(playerId);
    } else {
      team.roster.bench.push(playerId);
    }

    await DBManager.save(DBManager.STORES.TEAMS, teamId, team);
    
    console.log('✅ Player added to roster:', playerId, position);
  },

  /**
   * Remove player from roster
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   */
  async removePlayer(teamId, playerId) {
    const team = await this.get(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    team.roster.starters = team.roster.starters.filter(id => id !== playerId);
    team.roster.bench = team.roster.bench.filter(id => id !== playerId);

    await DBManager.save(DBManager.STORES.TEAMS, teamId, team);
    
    console.log('✅ Player removed from roster:', playerId);
  },

  /**
   * Move player between positions
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   * @param {string} newPosition - New position ('starters' or 'bench')
   */
  async movePlayer(teamId, playerId, newPosition) {
    await this.addPlayer(teamId, playerId, newPosition);
  },

  /**
   * Get all players on team
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Players on team
   */
  async getPlayers(teamId) {
    return await DBManager.query(DBManager.STORES.PLAYERS, 'teamId', teamId);
  },

  /**
   * Get roster with player details
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Roster with player details
   */
  async getRosterWithPlayers(teamId) {
    const team = await this.get(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    const allPlayers = await this.getPlayers(teamId);
    
    const starters = [];
    const bench = [];

    for (const playerId of team.roster.starters) {
      const player = allPlayers.find(p => p.playerId === playerId);
      if (player) starters.push(player);
    }

    for (const playerId of team.roster.bench) {
      const player = allPlayers.find(p => p.playerId === playerId);
      if (player) bench.push(player);
    }

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      teamPhoto: team.teamPhoto,
      manager: team.manager,
      starters,
      bench
    };
  },

  /**
   * Get team stats
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Team statistics
   */
  async getStats(teamId) {
    const roster = await this.getRosterWithPlayers(teamId);
    
    const totalPlayers = roster.starters.length + roster.bench.length;
    const startersCount = roster.starters.length;
    const benchCount = roster.bench.length;

    const allPlayers = [...roster.starters, ...roster.bench];
    const avgOverall = allPlayers.length > 0
      ? Math.round(allPlayers.reduce((sum, p) => sum + p.overall, 0) / allPlayers.length)
      : 0;

    const highestRated = allPlayers.length > 0
      ? allPlayers.reduce((max, p) => p.overall > max.overall ? p : max, allPlayers[0])
      : null;

    return {
      totalPlayers,
      startersCount,
      benchCount,
      avgOverall,
      highestRated,
      hasFullStartingLineup: startersCount === 5,
      hasBench: benchCount > 0
    };
  },

  /**
   * Get team division
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} Division info
   */
  async getDivision(teamId) {
    const stats = await this.getStats(teamId);
    return Divisions.categorizeTeam(stats);
  },

  /**
   * Set current team in session
   * @param {string} teamId - Team ID
   */
  setCurrentTeam(teamId) {
    sessionStorage.setItem('currentTeamId', teamId);
  },

  /**
   * Get current team ID from session
   * @returns {string|null} Current team ID
   */
  getCurrentTeamId() {
    return sessionStorage.getItem('currentTeamId') || Utils.getQueryParam('teamId');
  },

  /**
   * Get current team
   * @returns {Promise<object|null>} Current team
   */
  async getCurrentTeam() {
    const teamId = this.getCurrentTeamId();
    if (!teamId) return null;
    return await this.get(teamId);
  },

  /**
   * Clear current team from session
   */
  clearCurrentTeam() {
    sessionStorage.removeItem('currentTeamId');
  }
};

// Make Teams available globally
window.Teams = Teams;
