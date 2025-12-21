/**
 * NBA 2K-Style Rating System
 * Calculates overall rating and determines tier
 */

const Ratings = {
  /**
   * Tier thresholds and styling
   */
  TIER_THRESHOLDS: [
    { name: 'Dark Matter', min: 99, class: 'tier-dark-matter', rarity: 'Legendary', color: '#ff00ff' },
    { name: 'Galaxy Opal', min: 95, class: 'tier-galaxy-opal', rarity: 'Epic', color: '#f093fb' },
    { name: 'Pink Diamond', min: 90, class: 'tier-pink-diamond', rarity: 'Rare', color: '#ff69b4' },
    { name: 'Diamond', min: 86, class: 'tier-diamond', rarity: 'Uncommon', color: '#00bfff' },
    { name: 'Amethyst', min: 84, class: 'tier-amethyst', rarity: 'Common', color: '#b19cd9' },
    { name: 'Ruby', min: 82, class: 'tier-ruby', rarity: 'Common', color: '#ff6b9d' },
    { name: 'Sapphire', min: 79, class: 'tier-sapphire', rarity: 'Common', color: '#4169e1' },
    { name: 'Emerald', min: 76, class: 'tier-emerald', rarity: 'Common', color: '#50c878' },
    { name: 'Gold', min: 73, class: 'tier-gold', rarity: 'Basic', color: '#ffd700' },
    { name: 'Silver', min: 70, class: 'tier-silver', rarity: 'Basic', color: '#c0c0c0' },
    { name: 'Bronze', min: 0, class: 'tier-bronze', rarity: 'Basic', color: '#cd7f32' }
  ],

  /**
   * Base stat limits
   */
  BASE_STATS: {
    face: { min: 0, max: 15 },
    eyes: { min: 0, max: 5 },
    hair: { min: 0, max: 5 },
    top: { min: 0, max: 5 },
    bottom: { min: 0, max: 5 },
    fitness: { min: 0, max: 15 },
    history: { min: 0, max: 10 },
    personality: { min: 0, max: 20 },
    tolerance: { min: 0, max: 10 },
    substances: { min: 0, max: 10 }
  },

  /**
   * Cap breaker limits
   */
  CAP_BREAKERS: {
    athletic: { min: 0, max: 2 },
    height: { min: 0, max: 1 },
    attractiveness: { min: 0, max: 2 },
    intoYou: { min: 0, max: 1 },
    comfort: { min: 0, max: 2 }
  },

  /**
   * Calculate base total from stats
   * @param {object} stats - Base stats object
   * @returns {number} Base total (0-100)
   */
  calculateBaseTotal(stats) {
    let total = 0;
    
    Object.keys(this.BASE_STATS).forEach(key => {
      const value = parseInt(stats[key] || 0);
      const limits = this.BASE_STATS[key];
      
      // Clamp value within limits
      const clamped = Math.max(limits.min, Math.min(limits.max, value));
      total += clamped;
    });
    
    return total;
  },

  /**
   * Calculate cap breaker total
   * @param {object} capBreakers - Cap breaker object
   * @returns {number} Cap breaker total (0-8)
   */
  calculateCapBreakerTotal(capBreakers) {
    let total = 0;
    
    Object.keys(this.CAP_BREAKERS).forEach(key => {
      const value = parseInt(capBreakers[key] || 0);
      const limits = this.CAP_BREAKERS[key];
      
      // Clamp value within limits
      const clamped = Math.max(limits.min, Math.min(limits.max, value));
      total += clamped;
    });
    
    return total;
  },

  /**
   * Calculate overall rating
   * @param {number} baseTotal - Base total (0-100)
   * @param {number} capBreakerTotal - Cap breaker total (0-8)
   * @returns {number} Overall rating (0-108)
   */
  calculateOverall(baseTotal, capBreakerTotal) {
    return baseTotal + capBreakerTotal;
  },

  /**
   * Get tier for overall rating
   * @param {number} overall - Overall rating
   * @returns {object} Tier information
   */
  getTier(overall) {
    for (const tier of this.TIER_THRESHOLDS) {
      if (overall >= tier.min) {
        return tier;
      }
    }
    return this.TIER_THRESHOLDS[this.TIER_THRESHOLDS.length - 1]; // Default to Bronze
  },

  /**
   * Calculate all ratings for a player
   * @param {object} stats - Base stats
   * @param {object} capBreakers - Cap breakers
   * @returns {object} Complete ratings
   */
  calculatePlayerRatings(stats, capBreakers) {
    const baseTotal = this.calculateBaseTotal(stats);
    const capBreakerTotal = this.calculateCapBreakerTotal(capBreakers);
    const overall = this.calculateOverall(baseTotal, capBreakerTotal);
    const tier = this.getTier(overall);

    return {
      baseTotal,
      capBreakerTotal,
      overall,
      tier: tier.name,
      tierClass: tier.class,
      rarity: tier.rarity,
      color: tier.color
    };
  },

  /**
   * Validate stat value
   * @param {string} statName - Name of stat
   * @param {number} value - Value to validate
   * @returns {object} Validation result
   */
  validateStat(statName, value) {
    const limits = this.BASE_STATS[statName] || this.CAP_BREAKERS[statName];
    
    if (!limits) {
      return { isValid: false, message: `Unknown stat: ${statName}` };
    }

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      return { isValid: false, message: `${statName} must be a number` };
    }

    if (numValue < limits.min || numValue > limits.max) {
      return { 
        isValid: false, 
        message: `${statName} must be between ${limits.min} and ${limits.max}` 
      };
    }

    return { isValid: true, value: numValue };
  },

  /**
   * Create default stats object
   * @returns {object} Default stats
   */
  createDefaultStats() {
    const stats = {};
    Object.keys(this.BASE_STATS).forEach(key => {
      stats[key] = 0;
    });
    return stats;
  },

  /**
   * Create default cap breakers object
   * @returns {object} Default cap breakers
   */
  createDefaultCapBreakers() {
    const capBreakers = {};
    Object.keys(this.CAP_BREAKERS).forEach(key => {
      capBreakers[key] = 0;
    });
    return capBreakers;
  },

  /**
   * Get stat display name
   * @param {string} statKey - Stat key
   * @returns {string} Display name
   */
  getStatDisplayName(statKey) {
    const displayNames = {
      face: 'Face',
      eyes: 'Eyes',
      hair: 'Hair',
      top: 'Top',
      bottom: 'Bottom',
      fitness: 'Fitness',
      history: 'History',
      personality: 'Personality',
      tolerance: 'Tolerance',
      substances: 'Substances',
      athletic: 'Athletic/Build',
      height: 'Height',
      attractiveness: 'Attractiveness',
      intoYou: 'Into You',
      comfort: 'Comfort'
    };
    return displayNames[statKey] || statKey;
  },

  /**
   * Format overall with tier badge
   * @param {number} overall - Overall rating
   * @param {boolean} includeRarity - Include rarity text
   * @returns {string} Formatted HTML
   */
  formatOverallBadge(overall, includeRarity = false) {
    const tier = this.getTier(overall);
    
    let html = `<span class="overall-badge ${tier.class}">
      <span class="overall-number">${overall}</span>
      <span class="tier-name">${tier.name}</span>
    `;
    
    if (includeRarity) {
      html += `<span class="tier-rarity">${tier.rarity}</span>`;
    }
    
    html += `</span>`;
    
    return html;
  },

  /**
   * Get tier progress (for next tier)
   * @param {number} overall - Overall rating
   * @returns {object} Progress info
   */
  getTierProgress(overall) {
    const currentTier = this.getTier(overall);
    const currentIndex = this.TIER_THRESHOLDS.indexOf(currentTier);
    
    if (currentIndex === 0) {
      // Already at max tier
      return {
        current: currentTier,
        next: null,
        pointsToNext: 0,
        progress: 100
      };
    }

    const nextTier = this.TIER_THRESHOLDS[currentIndex - 1];
    const pointsToNext = nextTier.min - overall;
    const tierRange = nextTier.min - currentTier.min;
    const progress = ((overall - currentTier.min) / tierRange) * 100;

    return {
      current: currentTier,
      next: nextTier,
      pointsToNext,
      progress: Math.round(progress)
    };
  }
};

// Make Ratings available globally
window.Ratings = Ratings;
