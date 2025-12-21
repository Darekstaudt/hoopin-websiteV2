/**
 * Player Operations
 * CRUD operations for players with triple-layer persistence
 */

class PlayerManager {
  /**
   * Create new player
   */
  async createPlayer(playerData) {
    try {
      const playerId = generateId('player');
      
      // Compress player photo if provided
      let playerPhoto = playerData.playerPhoto || '';
      if (playerPhoto && playerPhoto.length > 1000) {
        try {
          playerPhoto = await imageOptimizer.compressBase64(playerPhoto);
        } catch (e) {
          console.warn('Photo compression failed, using original');
        }
      }

      // Calculate ratings
      const ratings = ratingsCalculator.calculatePlayerRatings(
        playerData.stats || {},
        playerData.capBreakers || {}
      );
      
      const player = {
        playerId,
        teamId: playerData.teamId,
        playerName: playerData.playerName,
        playerPhoto,
        stats: playerData.stats || {},
        capBreakers: playerData.capBreakers || {},
        baseTotal: ratings.baseTotal,
        capBreakerTotal: ratings.capBreakerTotal,
        overall: ratings.overall,
        tier: ratings.tier,
        tierClass: ratings.tierClass,
        rarity: ratings.rarity,
        color: ratings.color,
        gradient: ratings.gradient,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await dbManager.save('players', playerId, player);
      
      console.log('✅ Player created:', playerId, 'Overall:', ratings.overall);
      return { success: true, player };
    } catch (error) {
      console.error('❌ Create player error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get player by ID
   */
  async getPlayer(playerId) {
    try {
      const player = await dbManager.get('players', playerId);
      return player;
    } catch (error) {
      console.error('❌ Get player error:', error);
      return null;
    }
  }

  /**
   * Update player
   */
  async updatePlayer(playerId, updates) {
    try {
      const player = await dbManager.get('players', playerId);
      
      if (!player) {
        return { success: false, error: 'Player not found' };
      }

      // Compress player photo if updated
      if (updates.playerPhoto && updates.playerPhoto.length > 1000) {
        try {
          updates.playerPhoto = await imageOptimizer.compressBase64(updates.playerPhoto);
        } catch (e) {
          console.warn('Photo compression failed, using original');
        }
      }

      // Recalculate ratings if stats changed
      if (updates.stats || updates.capBreakers) {
        const stats = updates.stats || player.stats;
        const capBreakers = updates.capBreakers || player.capBreakers;
        const ratings = ratingsCalculator.calculatePlayerRatings(stats, capBreakers);
        
        updates.baseTotal = ratings.baseTotal;
        updates.capBreakerTotal = ratings.capBreakerTotal;
        updates.overall = ratings.overall;
        updates.tier = ratings.tier;
        updates.tierClass = ratings.tierClass;
        updates.rarity = ratings.rarity;
        updates.color = ratings.color;
        updates.gradient = ratings.gradient;
      }

      const updatedPlayer = {
        ...player,
        ...updates,
        playerId, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      await dbManager.save('players', playerId, updatedPlayer);
      
      console.log('✅ Player updated:', playerId);
      return { success: true, player: updatedPlayer };
    } catch (error) {
      console.error('❌ Update player error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete player
   */
  async deletePlayer(playerId) {
    try {
      await dbManager.delete('players', playerId);
      
      console.log('✅ Player deleted:', playerId);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete player error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all players in team
   */
  async getPlayersByTeam(teamId) {
    try {
      const players = await dbManager.query('players', player => player.teamId === teamId);
      
      // Sort by overall rating (descending)
      players.sort((a, b) => b.overall - a.overall);
      
      return players;
    } catch (error) {
      console.error('❌ Get players by team error:', error);
      return [];
    }
  }

  /**
   * Get all players
   */
  async getAllPlayers() {
    try {
      const players = await dbManager.getAll('players');
      players.sort((a, b) => b.overall - a.overall);
      return players;
    } catch (error) {
      console.error('❌ Get all players error:', error);
      return [];
    }
  }

  /**
   * Search players
   */
  async searchPlayers(query, teamId = null) {
    try {
      let players = teamId 
        ? await this.getPlayersByTeam(teamId)
        : await this.getAllPlayers();

      if (!query) return players;

      query = query.toLowerCase();
      return players.filter(player => 
        player.playerName.toLowerCase().includes(query) ||
        player.tier.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('❌ Search players error:', error);
      return [];
    }
  }

  /**
   * Get players by tier
   */
  async getPlayersByTier(tier, teamId = null) {
    try {
      let players = teamId 
        ? await this.getPlayersByTeam(teamId)
        : await this.getAllPlayers();

      return players.filter(player => player.tier === tier);
    } catch (error) {
      console.error('❌ Get players by tier error:', error);
      return [];
    }
  }

  /**
   * Get top players
   */
  async getTopPlayers(limit = 10, teamId = null) {
    try {
      let players = teamId 
        ? await this.getPlayersByTeam(teamId)
        : await this.getAllPlayers();

      return players.slice(0, limit);
    } catch (error) {
      console.error('❌ Get top players error:', error);
      return [];
    }
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(playerId) {
    try {
      const player = await this.getPlayer(playerId);
      
      if (!player) return null;

      const tierInfo = ratingsCalculator.getTier(player.overall);
      const tierProgress = ratingsCalculator.getTierProgress(player.overall);
      const nextTier = ratingsCalculator.getNextTier(player.overall);

      return {
        ...player,
        tierInfo,
        tierProgress,
        nextTier
      };
    } catch (error) {
      console.error('❌ Get player stats error:', error);
      return null;
    }
  }

  /**
   * Duplicate player (for testing)
   */
  async duplicatePlayer(playerId) {
    try {
      const player = await this.getPlayer(playerId);
      
      if (!player) {
        return { success: false, error: 'Player not found' };
      }

      const newPlayerData = {
        ...player,
        playerName: `${player.playerName} (Copy)`
      };

      delete newPlayerData.playerId;
      delete newPlayerData.createdAt;
      delete newPlayerData.updatedAt;

      return await this.createPlayer(newPlayerData);
    } catch (error) {
      console.error('❌ Duplicate player error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk create players
   */
  async bulkCreatePlayers(playersData) {
    const results = [];
    
    for (const playerData of playersData) {
      const result = await this.createPlayer(playerData);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      success: failed === 0,
      total: results.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Bulk delete players
   */
  async bulkDeletePlayers(playerIds) {
    const results = [];
    
    for (const playerId of playerIds) {
      const result = await this.deletePlayer(playerId);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      success: failed === 0,
      total: results.length,
      successful,
      failed
    };
  }

  /**
   * Check if player name exists in team
   */
  async playerNameExists(playerName, teamId) {
    try {
      const players = await this.getPlayersByTeam(teamId);
      return players.some(player => 
        player.playerName.toLowerCase() === playerName.toLowerCase()
      );
    } catch (error) {
      console.error('❌ Player name check error:', error);
      return false;
    }
  }
}

// Create global instance
const playerManager = new PlayerManager();
