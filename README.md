# 🏀 Hoopin' - Basketball Team Management Website

A production-ready, mobile-first basketball team management web application with permanent data persistence, offline support, and professional NBA 2K-style UI.

## Features

### 🎮 NBA 2K-Style Rating System
- Comprehensive player rating system (0-108 overall)
- 10 base stats + 5 cap breakers
- Custom 11-tier system (Bronze to Dark Matter)
- Live tier calculations with animated badges

### 💾 Triple-Layer Data Persistence
- **Layer 1**: Firebase Realtime Database (primary cloud storage)
- **Layer 2**: IndexedDB (browser database for offline)
- **Layer 3**: localStorage (session fallback)
- Data NEVER disappears - automatic sync across all layers

### ⚾ Baseball-Style Division System
- **D1** (Navy): Full starting 5 + 1+ bench
- **D2** (Cardinal Red): At least 1 player
- **D3** (Forest Green): At least 1 player (incomplete roster)
- **NAIA** (Gray): Zero players

### 📱 Mobile-First Design
- Touch-optimized interface (44px minimum touch targets)
- GPU-accelerated animations
- Skeleton loading screens
- Image compression (~70% reduction)
- Debounced auto-save (1 second)
- Works offline with Service Worker

## File Structure

```
hoopin-websiteV2/
├── index.html                  # Welcome/landing page
├── group-create.html           # Create new group
├── group-join.html             # Join existing group
├── dashboard.html              # Main group dashboard
├── team-create.html            # Create/edit team
├── player-add.html             # Add/edit player form
├── roster-view.html            # View team roster
├── divisions.html              # View all divisions
├── player-card.html            # Individual player card detail view
├── css/
│   ├── global.css              # Global styles and CSS variables
│   ├── mobile.css              # Mobile-specific responsive styles
│   ├── cards.css               # Player card NBA 2K-style designs
│   ├── forms.css               # Form styling with mobile optimization
│   ├── divisions.css           # Division-specific styles
│   └── animations.css          # GPU-accelerated animations
├── js/
│   ├── app.js                  # Main app initialization
│   ├── firebase-config.js      # Firebase setup
│   ├── db-manager.js           # Triple-layer data persistence manager
│   ├── image-optimizer.js      # Image compression utility
│   ├── performance.js          # Performance optimization utilities
│   ├── groups.js               # Group CRUD operations
│   ├── teams.js                # Team CRUD operations
│   ├── players.js              # Player CRUD operations
│   ├── ratings.js              # Rating calculation engine
│   ├── divisions.js            # Division logic
│   └── utils.js                # Helper functions
└── sw.js                       # Service Worker for offline support
```

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Realtime Database
3. Copy your Firebase configuration
4. Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Deploy

Simply host the files on any static web server or use:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

### 3. Open in Browser

Navigate to `index.html` to start using the app!

## Usage Guide

### Creating a Group
1. Click "Create New Group" on the landing page
2. Enter group name and password
3. Share the group ID and password with team members

### Joining a Group
1. Click "Join Existing Group"
2. Enter the group ID and password
3. Access the group dashboard

### Managing Teams
1. From the dashboard, create a new team
2. Add players with comprehensive stats
3. View roster with NBA 2K-style player cards
4. Teams are automatically categorized by division

### Player Rating System

**Base Stats (0-100 total):**
- Face (0-15)
- Eyes (0-5)
- Hair (0-5)
- Top (0-5)
- Bottom (0-5)
- Fitness (0-15)
- History (0-10)
- Personality (0-20)
- Tolerance (0-10)
- Substances (0-10)

**Cap Breakers (0-8 bonus):**
- Athletic/Build (0-2)
- Height (0-1)
- Attractiveness (0-2)
- Into You (0-1)
- Comfort (0-2)

**Overall = Base Total + Cap Breaker Total (Max 108)**

### Tier System
- 🌌 **Dark Matter** (99-108): Legendary
- 🌟 **Galaxy Opal** (95-98): Epic
- 💎 **Pink Diamond** (90-94): Rare
- 💠 **Diamond** (86-89): Uncommon
- 🟣 **Amethyst** (84-85): Common
- 🔴 **Ruby** (82-83): Common
- 🔵 **Sapphire** (79-81): Common
- 🟢 **Emerald** (76-78): Common
- 🟡 **Gold** (73-75): Basic
- ⚪ **Silver** (70-72): Basic
- 🟤 **Bronze** (0-69): Basic

## Technical Details

### Performance Optimizations
- GPU-accelerated CSS animations
- Debounced input handlers
- Lazy-loaded images
- Optimized bundle size
- Efficient data queries

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

### Offline Support
- Service Worker caches all assets
- Automatic background sync when online
- Works completely offline after first load

## Contributing

This is a personal project for basketball team management. Feel free to fork and customize for your own use!

## License

MIT License - Feel free to use and modify as needed.
