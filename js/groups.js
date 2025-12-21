/**
 * Group Management Module
 * Handles group creation, joining, and management
 */

const Groups = {
  /**
   * Create a new group
   * @param {string} groupName - Name of the group
   * @param {string} password - Group password
   * @param {string} creator - Creator name
   * @param {string} description - Group description
   * @returns {Promise<object>} Created group
   */
  async create(groupName, password, creator, description = '') {
    if (!groupName || !password) {
      throw new Error('Group name and password are required');
    }

    const validation = Utils.validatePassword(password);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    const groupId = Utils.generateId('group');
    const passwordHash = await Utils.hashPassword(password);

    const group = {
      groupId,
      groupName: groupName.trim(),
      password: passwordHash,
      creator: creator.trim(),
      description: description.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members: [creator.trim()],
      teams: []
    };

    await DBManager.save(DBManager.STORES.GROUPS, groupId, group);
    
    // Store current group in session
    this.setCurrentGroup(groupId);

    console.log('✅ Group created:', groupId);
    return group;
  },

  /**
   * Join existing group
   * @param {string} groupId - Group ID
   * @param {string} password - Group password
   * @param {string} memberName - Member name
   * @returns {Promise<object>} Group data
   */
  async join(groupId, password, memberName) {
    if (!groupId || !password) {
      throw new Error('Group ID and password are required');
    }

    const group = await DBManager.get(DBManager.STORES.GROUPS, groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }

    const passwordHash = await Utils.hashPassword(password);
    
    if (group.password !== passwordHash) {
      throw new Error('Incorrect password');
    }

    // Add member if not already in group
    if (!group.members.includes(memberName.trim())) {
      group.members.push(memberName.trim());
      await DBManager.save(DBManager.STORES.GROUPS, groupId, group);
    }

    // Store current group in session
    this.setCurrentGroup(groupId);

    console.log('✅ Joined group:', groupId);
    return group;
  },

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @returns {Promise<object>} Group data
   */
  async get(groupId) {
    return await DBManager.get(DBManager.STORES.GROUPS, groupId);
  },

  /**
   * Get all groups
   * @returns {Promise<Array>} All groups
   */
  async getAll() {
    return await DBManager.getAll(DBManager.STORES.GROUPS);
  },

  /**
   * Update group
   * @param {string} groupId - Group ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated group
   */
  async update(groupId, updates) {
    const group = await this.get(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }

    const updatedGroup = {
      ...group,
      ...updates,
      groupId, // Prevent ID change
      updatedAt: Date.now()
    };

    await DBManager.save(DBManager.STORES.GROUPS, groupId, updatedGroup);
    
    console.log('✅ Group updated:', groupId);
    return updatedGroup;
  },

  /**
   * Delete group
   * @param {string} groupId - Group ID
   */
  async delete(groupId) {
    // Delete all teams in group
    const teams = await DBManager.query(DBManager.STORES.TEAMS, 'groupId', groupId);
    for (const team of teams) {
      await Teams.delete(team.teamId);
    }

    // Delete group
    await DBManager.delete(DBManager.STORES.GROUPS, groupId);
    
    console.log('✅ Group deleted:', groupId);
  },

  /**
   * Add team to group
   * @param {string} groupId - Group ID
   * @param {string} teamId - Team ID
   */
  async addTeam(groupId, teamId) {
    const group = await this.get(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }

    if (!group.teams.includes(teamId)) {
      group.teams.push(teamId);
      await DBManager.save(DBManager.STORES.GROUPS, groupId, group);
    }
  },

  /**
   * Remove team from group
   * @param {string} groupId - Group ID
   * @param {string} teamId - Team ID
   */
  async removeTeam(groupId, teamId) {
    const group = await this.get(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }

    group.teams = group.teams.filter(id => id !== teamId);
    await DBManager.save(DBManager.STORES.GROUPS, groupId, group);
  },

  /**
   * Get teams in group
   * @param {string} groupId - Group ID
   * @returns {Promise<Array>} Teams in group
   */
  async getTeams(groupId) {
    return await DBManager.query(DBManager.STORES.TEAMS, 'groupId', groupId);
  },

  /**
   * Set current group in session
   * @param {string} groupId - Group ID
   */
  setCurrentGroup(groupId) {
    localStorage.setItem('currentGroupId', groupId);
    sessionStorage.setItem('currentGroupId', groupId);
  },

  /**
   * Get current group ID from session
   * @returns {string|null} Current group ID
   */
  getCurrentGroupId() {
    return localStorage.getItem('currentGroupId') || sessionStorage.getItem('currentGroupId') || Utils.getQueryParam('groupId');
  },

  /**
   * Get current group
   * @returns {Promise<object|null>} Current group
   */
  async getCurrentGroup() {
    const groupId = this.getCurrentGroupId();
    if (!groupId) return null;
    return await this.get(groupId);
  },

  /**
   * Clear current group from session
   */
  clearCurrentGroup() {
    localStorage.removeItem('currentGroupId');
    sessionStorage.removeItem('currentGroupId');
  },

  /**
   * Verify password for group
   * @param {string} groupId - Group ID
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} Is password correct
   */
  async verifyPassword(groupId, password) {
    const group = await this.get(groupId);
    if (!group) return false;

    const passwordHash = await Utils.hashPassword(password);
    return group.password === passwordHash;
  }
};

// Make Groups available globally
window.Groups = Groups;
