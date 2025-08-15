# 🎮 Kaat Color Multiplayer

A real-time multiplayer version of the traditional Kaat Color card game, built with HTML, CSS, JavaScript, and WebSocket technology.

![Kaat Color Game](https://img.shields.io/badge/Game-Kaat%20Color-brightgreen)
![Multiplayer](https://img.shields.io/badge/Multiplayer-4%20Players-blue)
![WebSocket](https://img.shields.io/badge/WebSocket-Real%20Time-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Game Overview

Kaat Color is a strategic 4-player team card game where players compete in teams of two. The game features dynamic trump establishment, complex trick allocation rules, and a sophisticated scoring system.

### 🎲 Game Rules

- **Teams**: 4 players split into 2 teams (Team 1: Players 1 & 3, Team 2: Players 2 & 4)
- **Dealing**: 52-card deck dealt in 5-4-4 format (13 cards per player)
- **Trump**: Dynamically established when a player "cuts" with a different suit
- **Trick-Taking**: Must follow lead suit if possible, trump beats non-trump cards
- **Scoring**: Tracks Talents, Coats, and Round Wins for each team
- **Dealer Rotation**: Complex rules based on round outcomes

## ✨ Features

### 🎮 Game Features
- ✅ Real-time multiplayer gameplay
- ✅ Dynamic trump establishment
- ✅ Complex trick allocation system
- ✅ Team-based scoring (Talents, Coats, Round Wins)
- ✅ Automatic dealer rotation
- ✅ Valid card highlighting
- ✅ Turn-based gameplay
- ✅ Room-based multiplayer

### 🌐 Multiplayer Features
- ✅ WebSocket real-time communication
- ✅ Room creation and joining
- ✅ Player join/leave notifications
- ✅ Connection status indicator
- ✅ Synchronized game state
- ✅ Cross-platform compatibility

### 🎨 UI Features
- ✅ Responsive design
- ✅ Modern card interface
- ✅ Team and player customization
- ✅ Real-time score updates
- ✅ Visual turn indicators
- ✅ Card animations

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/kaat-color-multiplayer.git
   cd kaat-color-multiplayer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open the game:**
   - For single-player: Open `index.html` in your browser
   - For multiplayer: Open `multiplayer.html` in your browser

## 🎯 How to Play

### Single Player Mode
1. Open `index.html` in your browser
2. Click "New Game" to start
3. Play all 4 players manually
4. Follow the game rules and scoring system

### Multiplayer Mode
1. Start the server: `npm start`
2. Open `multiplayer.html` in your browser
3. Enter your name and create/join a room
4. Share the Room ID with friends
5. Wait for 4 players to join
6. Click "Start Game" to begin

## 📁 Project Structure

```
kaat-color-multiplayer/
├── index.html              # Single-player game interface
├── multiplayer.html        # Multiplayer game interface
├── server.js              # WebSocket server
├── script.js              # Single-player game logic
├── styles.css             # Game styling
├── package.json           # Node.js dependencies
├── test.html              # Game logic tests
├── README.md              # This file
├── DEPLOYMENT_GUIDE.md    # Deployment instructions
├── MULTIPLAYER_README.md  # Multiplayer setup guide
└── .gitignore             # Git ignore rules
```

## 🌐 Deployment

### Local Development
```bash
npm run dev  # Starts server with auto-restart
```

### Production Deployment
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions on hosting platforms like:
- Railway (Recommended)
- Render
- Heroku
- DigitalOcean

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js
- **Real-time Communication**: WebSocket (ws library)
- **Styling**: Custom CSS with responsive design
- **Deployment**: Multiple platform support

## 🎮 Game Mechanics

### Trick Allocation System
1. **Before Trump**: Tricks are "stacked" and not awarded
2. **After Trump**: Tricks become "fresh"
3. **2 Consecutive Wins**: Player gets all stacked + fresh tricks
4. **End of Game**: Remaining tricks go to last winner

### Scoring System
- **Talents**: Awarded when opposing team wins all 13 tricks
- **Coats**: Awarded when trump team wins all 13 tricks
- **Round Wins**: Awarded to team with most tricks

### Dealer Rotation
Complex rules based on:
- Current dealer's team performance
- Whether team won/lost
- Number of tricks secured (7+ vs all 13)

## 🧪 Testing

Run the test suite to verify game logic:
```bash
# Open test.html in browser to run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Traditional Kaat Color card game rules
- WebSocket technology for real-time multiplayer
- Modern web development practices

## 📞 Support

If you encounter any issues:
1. Check the [troubleshooting guide](MULTIPLAYER_README.md#troubleshooting)
2. Open an issue on GitHub
3. Check browser console for errors
4. Verify server logs

## 🎯 Roadmap

- [ ] User authentication
- [ ] Persistent game sessions
- [ ] Chat functionality
- [ ] Spectator mode
- [ ] Tournament system
- [ ] Mobile app
- [ ] Sound effects
- [ ] Advanced animations

---

**Enjoy playing Kaat Color with friends! 🃏**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/your-username/kaat-color-multiplayer)
