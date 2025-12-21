/**
 * Group Operations
 * CRUD operations for groups with triple-layer persistence
 */

class GroupManager {
  constructor() {
    this.currentGroup = null;
  }

  /**
   * Create new group
   */
  async createGroup(groupData) {
    try {
      const groupId = generateId('group');
      const passwordHash = await hashPassword(groupData.password);
      
      const group = {
        groupId,
        groupName: groupData.groupName,
        passwordHash,
        creator: groupData.creator || 'Anonymous',
        description: groupData.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: [groupData.creator || 'Anonymous'],
        teams: []
      };

      await dbManager.save('groups', groupId, group);
      
      // Set as current group
      this.setCurrentGroup(group);
      
      console.log('✅ Group created:', groupId);
      return { success: true, group };
    } catch (error) {
      console.error('❌ Create group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join existing group
   */
  async joinGroup(groupId, password) {
    try {
      const group = await dbManager.get('groups', groupId);
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      const passwordHash = await hashPassword(password);
      
      if (group.passwordHash !== passwordHash) {
        return { success: false, error: 'Incorrect password' };
      }

      this.setCurrentGroup(group);
      
      console.log('✅ Joined group:', groupId);
      return { success: true, group };
    } catch (error) {
      console.error('❌ Join group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId) {
    try {
      const group = await dbManager.get('groups', groupId);
      return group;
    } catch (error) {
      console.error('❌ Get group error:', error);
      return null;
    }
  }

  /**
   * Update group
   */
  async updateGroup(groupId, updates) {
    try {
      const group = await dbManager.get('groups', groupId);
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      const updatedGroup = {
        ...group,
        ...updates,
        groupId, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      await dbManager.save('groups', groupId, updatedGroup);
      
      if (this.currentGroup && this.currentGroup.groupId === groupId) {
        this.setCurrentGroup(updatedGroup);
      }
      
      console.log('✅ Group updated:', groupId);
      return { success: true, group: updatedGroup };
    } catch (error) {
      console.error('❌ Update group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId) {
    try {
      // Get all teams in this group
      const teams = await dbManager.query('teams', team => team.groupId === groupId);
      
      // Delete all players in those teams
      for (const team of teams) {
        const players = await dbManager.query('players', player => player.teamId === team.teamId);
        for (const player of players) {
          await dbManager.delete('players', player.playerId);
        }
        await dbManager.delete('teams', team.teamId);
      }

      // Delete the group
      await dbManager.delete('groups', groupId);
      
      if (this.currentGroup && this.currentGroup.groupId === groupId) {
        this.currentGroup = null;
        storage.remove('currentGroup');
      }
      
      console.log('✅ Group deleted:', groupId);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add team to group
   */
  async addTeamToGroup(groupId, teamId) {
    try {
      const group = await dbManager.get('groups', groupId);
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      if (!group.teams.includes(teamId)) {
        group.teams.push(teamId);
        await dbManager.save('groups', groupId, group);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Add team to group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove team from group
   */
  async removeTeamFromGroup(groupId, teamId) {
    try {
      const group = await dbManager.get('groups', groupId);
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      group.teams = group.teams.filter(id => id !== teamId);
      await dbManager.save('groups', groupId, group);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Remove team from group error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all teams in group
   */
  async getGroupTeams(groupId) {
    try {
      const teams = await dbManager.query('teams', team => team.groupId === groupId);
      return teams;
    } catch (error) {
      console.error('❌ Get group teams error:', error);
      return [];
    }
  }

  /**
   * Add member to group
   */
  async addMember(groupId, memberName) {
    try {
      const group = await dbManager.get('groups', groupId);
      
      if (!group) {
        return { success: false, error: 'Group not found' };
      }

      if (!group.members.includes(memberName)) {
        group.members.push(memberName);
        await dbManager.save('groups', groupId, group);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Add member error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set current group (session)
   */
  setCurrentGroup(group) {
    this.currentGroup = group;
    storage.set('currentGroup', group);
  }

  /**
   * Get current group (session)
   */
  getCurrentGroup() {
    if (!this.currentGroup) {
      this.currentGroup = storage.get('currentGroup');
    }
    return this.currentGroup;
  }

  /**
   * Clear current group
   */
  clearCurrentGroup() {
    this.currentGroup = null;
    storage.remove('currentGroup');
  }

  /**
   * Check if user is in a group
   */
  isInGroup() {
    return this.getCurrentGroup() !== null;
  }

  /**
   * Get all groups (admin/debug)
   */
  async getAllGroups() {
    try {
      return await dbManager.getAll('groups');
    } catch (error) {
      console.error('❌ Get all groups error:', error);
      return [];
    }
  }
}

// Create global instance
const groupManager = new GroupManager();
