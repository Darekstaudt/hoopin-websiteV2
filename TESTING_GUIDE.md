# Testing Guide - Player Card Fixes

## Overview
This guide covers testing for the player card fixes including photo size, stat removal, full-width mobile view, and swap functionality.

## Test 1: Player Card Photo Size (60/35 Layout)

### Desktop Testing
1. Navigate to roster view (`roster-view.html?teamId=<your-team-id>`)
2. Observe the player cards in both "Starting 5" and "Bench" sections
3. **Expected Results:**
   - Photo should occupy ~60% of the card width on the RIGHT side
   - Stats should occupy ~35% of the card width on the LEFT side
   - Only 6 stats should be visible: Face, Eyes, Top, Bottom, Fitness, Personality
   - NO Athletic or Comfort stats should be shown
   - Overall rating badge should be in the top-left corner
   - Player name bar should be at the bottom

### Mobile Testing (< 768px)
1. Open DevTools and set viewport to mobile (e.g., iPhone 12)
2. Navigate to roster view
3. **Expected Results:**
   - Same layout as desktop but scaled appropriately
   - Starters cards: 220px × 308px minimum
   - Bench cards: 180px × 252px minimum (slightly smaller)
   - Photo still 60% on right, stats 35% on left

## Test 2: Player Detail Full-Width on Mobile

### Desktop Testing (> 768px)
1. Click on any player card to view details
2. **Expected Results:**
   - Card should be centered on the page
   - Maximum width: 600px
   - Has border-radius and box-shadow
   - Looks like a "card" floating on the page

### Mobile Testing (< 768px)
1. Open DevTools and set viewport to mobile
2. Click on any player card to view details
3. **Expected Results:**
   - Card should span FULL viewport width (100vw)
   - NO margins on left or right
   - NO border-radius (sharp corners)
   - NO box-shadow
   - Content should touch the edges of the screen
4. Open DevTools Console and verify:
   ```javascript
   document.querySelector('.player-detail-card').offsetWidth === window.innerWidth
   // Should return: true
   ```

## Test 3: Swap Functionality

### Pre-Test Setup
1. Ensure you have a team with at least 2 players (preferably 5+ players)
2. Open browser DevTools Console (F12) to monitor logs
3. Have Console visible throughout testing

### Test 3A: Initiating Swap Mode
1. Navigate to roster view
2. Click on any player card to view details
3. Click the "🔄 Swap" button
4. **Expected Console Output:**
   ```
   ═══════════════════════════════════════
   🔄 INITIATING SWAP MODE
   Player ID: <player-id>
   Player Name: <player-name>
   Team ID: <team-id>
   ═══════════════════════════════════════
   ```
5. **Expected Visual Results:**
   - Should navigate back to roster view
   - Banner should appear at top of page saying: "🔄 SWAP MODE: Click a player to swap with <PLAYER NAME>"
   - Banner should have pink/red gradient background
   - "✕ Cancel" button should be visible
   - URL should have `?swapMode=true&swapPlayerId=<player-id>`

### Test 3B: Visual Indicators in Swap Mode
1. While in swap mode, observe the roster
2. **Expected Visual Results:**
   - The source player card should have:
     - Reduced opacity (0.7)
     - Pink outline (3px solid #f093fb)
     - Outline offset of 2px
   - All cards should have cursor: pointer

### Test 3C: Executing a Swap (Starter ↔ Starter)
1. In swap mode, click on a DIFFERENT starter player
2. **Expected Console Output:**
   ```
   🎯 Card clicked in swap mode: <target-player-id> <target-player-name>
   ═══════════════════════════════════════
   🔄 SWAP EXECUTION START
   Source Player ID: <source-id>
   Target Player ID: <target-id>
   ═══════════════════════════════════════
   📋 Current roster before swap:
     Starters: [<array of player IDs>]
     Bench: [<array of player IDs>]
   📍 Player positions found:
     Source in starters: <index>
     Target in starters: <index>
     Source in bench: -1
     Target in bench: -1
   ✅ Swapped positions in starters
   📋 New roster after swap:
     Starters: [<updated array>]
     Bench: [<unchanged array>]
   💾 Saving to database...
   🔍 Verification - Roster after save:
     Starters: [<updated array>]
     Bench: [<unchanged array>]
   ═══════════════════════════════════════
   ✅ SWAP COMPLETED SUCCESSFULLY
   ═══════════════════════════════════════
   🔄 Reloading page...
   ```
3. **Expected Visual Results:**
   - Success toast: "✅ Swapped <name1> ↔ <name2>"
   - Banner disappears
   - Page reloads after ~1.2 seconds
   - Players are now in SWAPPED positions

### Test 3D: Executing a Swap (Bench ↔ Bench)
1. Repeat Test 3A to initiate swap mode with a bench player
2. Click on a DIFFERENT bench player
3. **Expected Console Output:**
   - Similar to Test 3C but shows "Swapped positions on bench"
   - Starters array unchanged, Bench array shows swapped positions

### Test 3E: Executing a Swap (Starter ↔ Bench)
1. Repeat Test 3A to initiate swap mode with a starter
2. Click on a bench player
3. **Expected Console Output:**
   - Shows "Moved source to bench, target to starters"
   - Both arrays should show changes

### Test 3F: Cancelling Swap Mode
1. Initiate swap mode
2. Click the "✕ Cancel" button
3. **Expected Console Output:**
   ```
   ❌ Exiting swap mode
   ✕ Swap mode cancelled
   ```
4. **Expected Visual Results:**
   - Banner disappears
   - URL parameters removed (no ?swapMode or ?swapPlayerId)
   - Cards return to normal appearance

### Test 3G: Attempting Self-Swap
1. Initiate swap mode with a player
2. Try to click the SAME player (the one with the outline)
3. **Expected Console Output:**
   ```
   ⚠️ Attempted to swap player with themselves
   ```
4. **Expected Visual Results:**
   - Error toast: "Cannot swap a player with themselves!"
   - Swap mode remains active
   - No changes made

## Test 4: Regression Testing

### Verify Existing Functionality Still Works
- [ ] Player cards display correctly without swap mode
- [ ] Click on player card opens detail view
- [ ] Team stats display correctly
- [ ] All player stats visible on detail page
- [ ] Edit, Share, Delete buttons still work
- [ ] Navigation back to dashboard works
- [ ] Team menu still accessible

## Common Issues and Solutions

### Issue: Photo not taking 60% width
- Check: `.player-card-photo-side` CSS has `flex: 0 0 60%`
- Check: `.player-card-stats-side` CSS has `flex: 0 0 35%`
- Check: Parent `.player-card-body` has `display: flex`

### Issue: Athletic/Comfort stats still showing
- Check: roster-view.html line ~268-273 only has 6 stat lines
- Should NOT have any `stat-line-cap` divs

### Issue: Player detail not full-width on mobile
- Check: DevTools shows mobile viewport (< 768px)
- Check: `.player-detail-card` has `width: 100vw !important` in mobile CSS
- Check: No parent elements have padding/margins

### Issue: Swap not working
- Check: Console for error messages
- Verify: `dbManager`, `playerManager`, `teamManager` are defined
- Verify: Team ID is valid in URL
- Check: Network tab for database save operations

### Issue: Swap mode not activating
- Check: URL has `?swapMode=true&swapPlayerId=<id>`
- Check: Console shows "🔄 SWAP MODE ACTIVATED"
- Check: Banner appears at top of container

## Performance Notes
- All changes are CSS/HTML only, no performance impact expected
- Swap functionality uses existing database operations
- Console logging may be verbose but can be disabled in production

## Browser Compatibility
Tested and expected to work on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Notes
- Player cards remain keyboard accessible
- Screen readers should announce player names
- Swap mode should be announced via aria-live regions (future enhancement)
- High contrast mode should still show outlines

---

## Quick Test Checklist

**Before Deployment:**
- [ ] Photo is 60% on right side
- [ ] Stats are 35% on left side  
- [ ] Only 6 stats showing (no Athletic/Comfort)
- [ ] Mobile detail view is full-width
- [ ] Desktop detail view is centered
- [ ] Swap mode activates with banner
- [ ] Source card has visual indicator
- [ ] Console logs show detailed swap info
- [ ] Swap actually moves players
- [ ] All 3 swap types work correctly
- [ ] Cancel swap works
- [ ] Self-swap is prevented
- [ ] Existing features still work

**If any test fails, check Console for errors and review TESTING_GUIDE.md troubleshooting section.**
