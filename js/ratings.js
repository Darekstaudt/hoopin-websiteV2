/**
 * NBA 2K-Style Rating Calculation Engine
 * 
 * Base Stats (0-100 total):
 * - Face (0-15), Eyes (0-5), Hair (0-5), Top (0-5), Bottom (0-5)
 * - Fitness (0-15), History (0-10), Personality (0-20)
 * - Tolerance (0-10), Substances (0-10)
 * 
 * Cap Breakers (0-8 bonus):
 * - Athletic/Build (0-2), Height (0-1), Attractiveness (0-2)
 * - Into You (0-1), Comfort (0-2)
 * 
 * Overall = Base Total + Cap Breaker Total (Max 108)
 */

// Tier thresholds and styling
const TIER_THRESHOLDS = [
  { 
    name: 'Dark Matter', 
    min: 99, 
    max: 108,
    class: 'tier-dark-matter', 
    rarity: 'Legendary', 
    color: '#ff00ff',
    gradient: 'linear-gradient(135deg, #1a0033 0%, #8000ff 50%, #ff00ff 100%)'
  },
  { 
    name: 'Galaxy Opal', 
    min: 95, 
    max: 98,
    class: 'tier-galaxy-opal', 
    rarity: 'Epic', 
    color: '#f093fb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #764ba2 100%)'
  },
  { 
    name: 'Pink Diamond', 
    min: 90, 
    max: 94,
    class: 'tier-pink-diamond', 
    rarity: 'Rare', 
    color: '#ff69b4',
    gradient: 'linear-gradient(135deg, #ff6b9d 0%, #ffc3e6 50%, #ff69b4 100%)'
  },
  { 
    name: 'Diamond', 
    min: 86, 
    max: 89,
    class: 'tier-diamond', 
    rarity: 'Uncommon', 
    color: '#00bfff',
    gradient: 'linear-gradient(135deg, #0099ff 0%, #66d9ff 50%, #00bfff 100%)'
  },
  { 
    name: 'Amethyst', 
    min: 84, 
    max: 85,
    class: 'tier-amethyst', 
    rarity: 'Common', 
    color: '#b19cd9',
    gradient: 'linear-gradient(135deg, #9966cc 0%, #d4b5ff 50%, #b19cd9 100%)'
  },
  { 
    name: 'Ruby', 
    min: 82, 
    max: 83,
    class: 'tier-ruby', 
    rarity: 'Common', 
    color: '#ff6b9d',
    gradient: 'linear-gradient(135deg, #e91e63 0%, #ff6b9d 50%, #ff4081 100%)'
  },
  { 
    name: 'Sapphire', 
    min: 79, 
    max: 81,
    class: 'tier-sapphire', 
    rarity: 'Common', 
    color: '#4169e1',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #4169e1 50%, #2a5298 100%)'
  },
  { 
    name: 'Emerald', 
    min: 76, 
    max: 78,
    class: 'tier-emerald', 
    rarity: 'Common', 
    color: '#50c878',
    gradient: 'linear-gradient(135deg, #2ecc71 0%, #50c878 50%, #27ae60 100%)'
  },
  { 
    name: 'Gold', 
    min: 73, 
    max: 75,
    class: 'tier-gold', 
    rarity: 'Basic', 
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #f39c12 0%, #ffd700 50%, #f1c40f 100%)'
  },
  { 
    name: 'Silver', 
    min: 70, 
    max: 72,
    class: 'tier-silver', 
    rarity: 'Basic', 
    color: '#c0c0c0',
    gradient: 'linear-gradient(135deg, #95a5a6 0%, #c0c0c0 50%, #bdc3c7 100%)'
  },
  { 
    name: 'Bronze', 
    min: 0, 
    max: 69,
    class: 'tier-bronze', 
    rarity: 'Basic', 
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #a0522d 0%, #cd7f32 50%, #b8860b 100%)'
  }
];

// Base stat limits
const BASE_STATS = {
  face: { min: 0, max: 15, label: 'Face' },
  eyes: { min: 0, max: 5, label: 'Eyes' },
  hair: { min: 0, max: 5, label: 'Hair' },
  top: { min: 0, max: 5, label: 'Top' },
  bottom: { min: 0, max: 5, label: 'Bottom' },
  fitness: { min: 0, max: 15, label: 'Fitness' },
  history: { min: 0, max: 10, label: 'History' },
  personality: { min: 0, max: 20, label: 'Personality' },
  tolerance: { min: 0, max: 10, label: 'Tolerance' },
  substances: { min: 0, max: 10, label: 'Substances' }
};

// Cap breaker limits
const CAP_BREAKERS = {
  athletic: { min: 0, max: 2, label: 'Athletic/Build' },
  height: { min: 0, max: 1, label: 'Height' },
  attractiveness: { min: 0, max: 2, label: 'Attractiveness' },
  intoYou: { min: 0, max: 1, label: 'Into You' },
  comfort: { min: 0, max: 2, label: 'Comfort' }
};

const MAX_BASE_TOTAL = 100;
const MAX_CAP_BREAKER_TOTAL = 8;
const MAX_OVERALL = 108;

class RatingsCalculator {
  /**
   * Calculate base stats total
   */
  calculateBaseTotal(stats) {
    if (!stats) return 0;
    
    let total = 0;
    for (const [key, limits] of Object.entries(BASE_STATS)) {
      const value = parseInt(stats[key]) || 0;
      total += Math.max(limits.min, Math.min(limits.max, value));
    }
    
    return Math.min(total, MAX_BASE_TOTAL);
  }

  /**
   * Calculate cap breakers total
   */
  calculateCapBreakerTotal(capBreakers) {
    if (!capBreakers) return 0;
    
    let total = 0;
    for (const [key, limits] of Object.entries(CAP_BREAKERS)) {
      const value = parseInt(capBreakers[key]) || 0;
      total += Math.max(limits.min, Math.min(limits.max, value));
    }
    
    return Math.min(total, MAX_CAP_BREAKER_TOTAL);
  }

  /**
   * Calculate overall rating
   */
  calculateOverall(stats, capBreakers) {
    const baseTotal = this.calculateBaseTotal(stats);
    const capBreakerTotal = this.calculateCapBreakerTotal(capBreakers);
    const overall = baseTotal + capBreakerTotal;
    
    return Math.min(overall, MAX_OVERALL);
  }

  /**
   * Get tier information for overall rating
   */
  getTier(overall) {
    for (const tier of TIER_THRESHOLDS) {
      if (overall >= tier.min) {
        return tier;
      }
    }
    return TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1]; // Bronze as fallback
  }

  /**
   * Calculate complete player ratings
   */
  calculatePlayerRatings(stats, capBreakers) {
    const baseTotal = this.calculateBaseTotal(stats);
    const capBreakerTotal = this.calculateCapBreakerTotal(capBreakers);
    const overall = baseTotal + capBreakerTotal;
    const tier = this.getTier(overall);

    return {
      baseTotal,
      capBreakerTotal,
      overall,
      tier: tier.name,
      tierClass: tier.class,
      rarity: tier.rarity,
      color: tier.color,
      gradient: tier.gradient
    };
  }

  /**
   * Validate stat value
   */
  validateStat(statKey, value, isCapBreaker = false) {
    const limits = isCapBreaker ? CAP_BREAKERS[statKey] : BASE_STATS[statKey];
    
    if (!limits) {
      throw new Error(`Unknown stat: ${statKey}`);
    }

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Must be a number' };
    }

    if (numValue < limits.min || numValue > limits.max) {
      return { 
        valid: false, 
        error: `Must be between ${limits.min} and ${limits.max}` 
      };
    }

    return { valid: true, value: numValue };
  }

  /**
   * Get stat percentage for progress bars
   */
  getStatPercentage(value, max) {
    return Math.round((value / max) * 100);
  }

  /**
   * Get tier progress (how far into current tier)
   */
  getTierProgress(overall) {
    const tier = this.getTier(overall);
    const tierRange = tier.max - tier.min + 1;
    const progress = overall - tier.min;
    return Math.round((progress / tierRange) * 100);
  }

  /**
   * Get next tier information
   */
  getNextTier(overall) {
    const currentTier = this.getTier(overall);
    const currentIndex = TIER_THRESHOLDS.findIndex(t => t.name === currentTier.name);
    
    if (currentIndex > 0) {
      const nextTier = TIER_THRESHOLDS[currentIndex - 1];
      const pointsNeeded = nextTier.min - overall;
      return {
        tier: nextTier,
        pointsNeeded: Math.max(0, pointsNeeded)
      };
    }
    
    return null; // Already at max tier
  }

  /**
   * Create tier badge HTML
   */
  createTierBadge(overall, size = 'medium') {
    const ratings = this.calculatePlayerRatings({}, {});
    ratings.overall = overall;
    const tier = this.getTier(overall);

    return `
      <div class="tier-badge tier-${size} ${tier.class}" style="background: ${tier.gradient}">
        <div class="tier-overall">${overall}</div>
        <div class="tier-name">${tier.name}</div>
        <div class="tier-rarity">${tier.rarity}</div>
      </div>
    `;
  }

  /**
   * Create stat bars HTML
   */
  createStatBars(stats, capBreakers) {
    let html = '<div class="stat-bars">';
    
    // Base stats
    html += '<div class="stat-section"><h4>Base Stats</h4>';
    for (const [key, limits] of Object.entries(BASE_STATS)) {
      const value = parseInt(stats[key]) || 0;
      const percentage = this.getStatPercentage(value, limits.max);
      html += `
        <div class="stat-bar">
          <label>${limits.label}</label>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
            <span class="bar-value">${value}/${limits.max}</span>
          </div>
        </div>
      `;
    }
    html += '</div>';

    // Cap breakers
    html += '<div class="stat-section"><h4>Cap Breakers</h4>';
    for (const [key, limits] of Object.entries(CAP_BREAKERS)) {
      const value = parseInt(capBreakers[key]) || 0;
      const percentage = this.getStatPercentage(value, limits.max);
      html += `
        <div class="stat-bar">
          <label>${limits.label}</label>
          <div class="bar-container">
            <div class="bar-fill cap-breaker" style="width: ${percentage}%"></div>
            <span class="bar-value">${value}/${limits.max}</span>
          </div>
        </div>
      `;
    }
    html += '</div></div>';

    return html;
  }

  /**
   * Get all tiers for display
   */
  getAllTiers() {
    return TIER_THRESHOLDS;
  }

  /**
   * Get stat limits
   */
  getBaseStats() {
    return BASE_STATS;
  }

  getCapBreakers() {
    return CAP_BREAKERS;
  }

  getMaxValues() {
    return {
      baseTotal: MAX_BASE_TOTAL,
      capBreakerTotal: MAX_CAP_BREAKER_TOTAL,
      overall: MAX_OVERALL
    };
  }
}

// Create global instance
const ratingsCalculator = new RatingsCalculator();
