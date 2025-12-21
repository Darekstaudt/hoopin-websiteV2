/**
 * Player Management Module
 * Handles player creation, rating calculation, and operations
 */

const Players = {
  /**
   * Create a new player
   * @param {string} playerName - Name of the player
   * @param {string} teamId - Team ID
   * @param {object} stats - Base stats
   * @param {object} capBreakers - Cap breakers
   * @param {string} playerPhoto - Player photo (base64)
   * @returns {Promise<object>} Created player
   */
  async create(playerName, teamId, stats, capBreakers, playerPhoto = null) {
    if (!playerName || !teamId) {
      throw new Error('Player name and team ID are required');
    }

    const playerId = Utils.generateId('player');

    // Calculate ratings
    const ratings = Ratings.calculatePlayerRatings(stats, capBreakers);

    const player = {
      playerId,
      playerName: playerName.trim(),
      teamId,
      playerPhoto,
      stats,
      capBreakers,
      baseTotal: ratings.baseTotal,
      capBreakerTotal: ratings.capBreakerTotal,
      overall: ratings.overall,
      tier: ratings.tier,
      tierClass: ratings.tierClass,
      rarity: ratings.rarity,
      color: ratings.color,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await DBManager.save(DBManager.STORES.PLAYERS, playerId, player);
    
    // Add player to team roster (bench by default)
    await Teams.addPlayer(teamId, playerId, 'bench');

    console.log('✅ Player created:', playerId, `Overall: ${player.overall}`);
    return player;
  },

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {Promise<object>} Player data
   */
  async get(playerId) {
    return await DBManager.get(DBManager.STORES.PLAYERS, playerId);
  },

  /**
   * Get all players
   * @returns {Promise<Array>} All players
   */
  async getAll() {
    return await DBManager.getAll(DBManager.STORES.PLAYERS);
  },

  /**
   * Get players by team
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Players on team
   */
  async getByTeam(teamId) {
    return await DBManager.query(DBManager.STORES.PLAYERS, 'teamId', teamId);
  },

  /**
   * Update player
   * @param {string} playerId - Player ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated player
   */
  async update(playerId, updates) {
    const player = await this.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    // If stats or capBreakers updated, recalculate ratings
    if (updates.stats || updates.capBreakers) {
      const stats = updates.stats || player.stats;
      const capBreakers = updates.capBreakers || player.capBreakers;
      const ratings = Ratings.calculatePlayerRatings(stats, capBreakers);
      
      updates.baseTotal = ratings.baseTotal;
      updates.capBreakerTotal = ratings.capBreakerTotal;
      updates.overall = ratings.overall;
      updates.tier = ratings.tier;
      updates.tierClass = ratings.tierClass;
      updates.rarity = ratings.rarity;
      updates.color = ratings.color;
    }

    const updatedPlayer = {
      ...player,
      ...updates,
      playerId, // Prevent ID change
      updatedAt: Date.now()
    };

    await DBManager.save(DBManager.STORES.PLAYERS, playerId, updatedPlayer);
    
    console.log('✅ Player updated:', playerId);
    return updatedPlayer;
  },

  /**
   * Delete player
   * @param {string} playerId - Player ID
   */
  async delete(playerId) {
    const player = await this.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    // Remove from team roster
    if (player.teamId) {
      await Teams.removePlayer(player.teamId, playerId);
    }

    // Delete player
    await DBManager.delete(DBManager.STORES.PLAYERS, playerId);
    
    console.log('✅ Player deleted:', playerId);
  },

  /**
   * Update player stats
   * @param {string} playerId - Player ID
   * @param {object} stats - New stats
   * @returns {Promise<object>} Updated player
   */
  async updateStats(playerId, stats) {
    return await this.update(playerId, { stats });
  },

  /**
   * Update player cap breakers
   * @param {string} playerId - Player ID
   * @param {object} capBreakers - New cap breakers
   * @returns {Promise<object>} Updated player
   */
  async updateCapBreakers(playerId, capBreakers) {
    return await this.update(playerId, { capBreakers });
  },

  /**
   * Get top players by overall rating
   * @param {number} limit - Number of players to return
   * @returns {Promise<Array>} Top players
   */
  async getTopPlayers(limit = 10) {
    const allPlayers = await this.getAll();
    return allPlayers
      .sort((a, b) => b.overall - a.overall)
      .slice(0, limit);
  },

  /**
   * Get players by tier
   * @param {string} tierName - Tier name
   * @returns {Promise<Array>} Players in tier
   */
  async getByTier(tierName) {
    const allPlayers = await this.getAll();
    return allPlayers.filter(player => player.tier === tierName);
  },

  /**
   * Search players by name
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching players
   */
  async search(query) {
    const allPlayers = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return allPlayers.filter(player => 
      player.playerName.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get player stats summary
   * @param {string} playerId - Player ID
   * @returns {Promise<object>} Stats summary
   */
  async getStatsSummary(playerId) {
    const player = await this.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    const tierProgress = Ratings.getTierProgress(player.overall);

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      overall: player.overall,
      tier: player.tier,
      rarity: player.rarity,
      baseTotal: player.baseTotal,
      capBreakerTotal: player.capBreakerTotal,
      tierProgress,
      createdAt: player.createdAt
    };
  },

  /**
   * Clone player (duplicate with new ID)
   * @param {string} playerId - Player ID to clone
   * @param {string} newTeamId - New team ID (optional, uses same team if not provided)
   * @returns {Promise<object>} Cloned player
   */
  async clone(playerId, newTeamId = null) {
    const player = await this.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    const teamId = newTeamId || player.teamId;
    return await this.create(
      `${player.playerName} (Copy)`,
      teamId,
      player.stats,
      player.capBreakers,
      player.playerPhoto
    );
  },

  /**
   * Export player data as JSON
   * @param {string} playerId - Player ID
   * @returns {Promise<string>} JSON string
   */
  async exportPlayer(playerId) {
    const player = await this.get(playerId);
    
    if (!player) {
      throw new Error('Player not found');
    }

    return JSON.stringify(player, null, 2);
  },

  /**
   * Import player from JSON
   * @param {string} jsonString - JSON string
   * @param {string} teamId - Team ID to import to
   * @returns {Promise<object>} Imported player
   */
  async importPlayer(jsonString, teamId) {
    try {
      const data = JSON.parse(jsonString);
      
      return await this.create(
        data.playerName || 'Imported Player',
        teamId,
        data.stats || Ratings.createDefaultStats(),
        data.capBreakers || Ratings.createDefaultCapBreakers(),
        data.playerPhoto || null
      );
    } catch (error) {
      throw new Error('Invalid player data');
    }
  },

  /**
   * Save draft (temporary player data)
   * @param {string} draftKey - Draft key
   * @param {object} data - Draft data
   */
  saveDraft(draftKey, data) {
    try {
      localStorage.setItem(`draft_${draftKey}`, JSON.stringify({
        ...data,
        savedAt: Date.now()
      }));
      console.log('💾 Draft saved:', draftKey);
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  },

  /**
   * Load draft
   * @param {string} draftKey - Draft key
   * @returns {object|null} Draft data
   */
  loadDraft(draftKey) {
    try {
      const data = localStorage.getItem(`draft_${draftKey}`);
      if (data) {
        const draft = JSON.parse(data);
        console.log('📂 Draft loaded:', draftKey);
        return draft;
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
    return null;
  },

  /**
   * Clear draft
   * @param {string} draftKey - Draft key
   */
  clearDraft(draftKey) {
    try {
      localStorage.removeItem(`draft_${draftKey}`);
      console.log('🗑️ Draft cleared:', draftKey);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }
};

// Make Players available globally
window.Players = Players;
