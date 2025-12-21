# 🏀 Hoopin' - Basketball Team Management Website

A production-ready, mobile-first basketball team management web application with permanent data persistence, offline support, and professional NBA 2K-style UI.

## Features

### Core Functionality
- **Group Management**: Create and join basketball groups with password protection
- **Team Management**: Create teams, manage rosters (starters + bench)
- **Player Management**: Add players with detailed ratings and stats
- **NBA 2K-Style Ratings**: 11-tier rating system (Bronze to Dark Matter)
- **Division System**: Automatic categorization (D1, D2, D3, NAIA) based on roster
- **Triple-Layer Persistence**: Firebase + IndexedDB + localStorage - data never disappears
- **Offline Support**: Full functionality without internet via Service Worker
- **Mobile-First**: Optimized for touch devices with responsive design

### Rating System

**Base Stats (0-100 total):**
- Face (0-15), Eyes (0-5), Hair (0-5)
- Top (0-5), Bottom (0-5)
- Fitness (0-15)
- History (0-10), Personality (0-20)
- Tolerance (0-10), Substances (0-10)

**Cap Breakers (0-8 bonus):**
- Athletic/Build (0-2), Height (0-1)
- Attractiveness (0-2), Into You (0-1), Comfort (0-2)

**Overall = Base Total + Cap Breaker Total** (Max 108)

### Tier System
- **Dark Matter** (99+): Legendary - Purple/Pink gradient
- **Galaxy Opal** (95+): Epic - Purple gradient
- **Pink Diamond** (90+): Rare - Hot pink
- **Diamond** (86+): Uncommon - Deep sky blue
- **Amethyst** (84+): Common - Purple
- **Ruby** (82+): Common - Pink
- **Sapphire** (79+): Common - Royal blue
- **Emerald** (76+): Common - Green
- **Gold** (73+): Basic - Gold
- **Silver** (70+): Basic - Silver
- **Bronze** (0-69): Basic - Bronze

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Realtime Database** in "Build" section
4. Set database rules to:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
5. Get your Firebase config from Project Settings
6. Open `js/firebase-config.js` and replace placeholder values:

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

### 2. Running the Application

**Option A: Local Development Server (Recommended)**
```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server -p 8000
```

Then open: `http://localhost:8000`

**Option B: Direct File Access**
- Simply open `index.html` in a modern web browser
- Note: Some features (Service Worker) require HTTPS or localhost

### 3. First Use

1. Open the app in your browser
2. Click "Create Group" to start a new basketball group
3. Set a group name and password
4. Create teams and add players
5. View automatic division assignments based on roster size

## File Structure

```
hoopin-websiteV2/
├── index.html              # Landing page
├── group-create.html       # Create group
├── group-join.html         # Join group
├── dashboard.html          # Main dashboard
├── team-create.html        # Create/edit team
├── player-add.html         # Add/edit player
├── roster-view.html        # View roster
├── divisions.html          # View divisions
├── player-card.html        # Player detail view
├── css/
│   ├── global.css          # Global styles
│   ├── mobile.css          # Mobile responsiveness
│   ├── cards.css           # Player cards
│   ├── forms.css           # Form styling
│   ├── divisions.css       # Division styles
│   └── animations.css      # Animations
├── js/
│   ├── app.js              # Main initialization
│   ├── firebase-config.js  # Firebase setup
│   ├── db-manager.js       # Data persistence
│   ├── image-optimizer.js  # Image compression
│   ├── performance.js      # Performance utils
│   ├── groups.js           # Group operations
│   ├── teams.js            # Team operations
│   ├── players.js          # Player operations
│   ├── ratings.js          # Rating engine
│   ├── divisions.js        # Division logic
│   └── utils.js            # Helper functions
└── sw.js                   # Service Worker

```

## Data Persistence

The app uses a **triple-layer persistence system** ensuring data is never lost:

1. **Firebase Realtime Database**: Primary cloud storage, syncs across devices
2. **IndexedDB**: Local browser database for offline access
3. **localStorage**: Session fallback for quick access

Data automatically syncs between all layers when online.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Technologies Used

- **Vanilla JavaScript** (ES6+)
- **Firebase Realtime Database** (Cloud storage)
- **IndexedDB API** (Offline storage)
- **Service Worker API** (Offline support)
- **CSS3** (Grid, Flexbox, Custom Properties)
- **Progressive Web App** (PWA)

## Development Notes

### Image Optimization
- All images compressed to ~70% size
- Target: < 500KB per image
- Automatic compression on upload

### Performance
- GPU-accelerated animations
- Skeleton loading screens
- Debounced auto-save (1 second)
- Lazy loading for images

### Mobile Optimization
- Touch targets: 44px minimum
- Input font size: 16px minimum (prevents zoom)
- Horizontal scroll with snap points
- Gesture-friendly UI

## License

MIT License - Feel free to use for personal or commercial projects

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for basketball team management
