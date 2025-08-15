# 🎮 Kaat Color Multiplayer

A real-time multiplayer version of the Kaat Color card game using WebSocket technology.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Open the multiplayer game:**
   - Open `multiplayer.html` in your browser
   - Or serve it using a local server

## 🎯 How to Play Multiplayer

### Creating a Room
1. Enter your name in the "Your Name" field
2. Click "Create Room"
3. Share the generated Room ID with your friends
4. Wait for 4 players to join

### Joining a Room
1. Enter your name in the "Your Name" field
2. Enter the Room ID provided by the room creator
3. Click "Join Room"

### Game Flow
1. **Waiting Room**: All 4 players must join before the game can start
2. **Game Start**: Once 4 players are in, click "Start Game"
3. **Playing**: Take turns playing cards according to the game rules
4. **New Rounds**: Click "New Round" to start a new round

## 🌐 Network Setup

### Local Network (Same WiFi)
- All players can connect using the same computer's IP address
- Example: `ws://192.168.1.100:3000`

### Internet (Different locations)
- Deploy the server to a cloud platform (Heroku, Railway, etc.)
- Update the WebSocket URL in `multiplayer.html`

## 📁 File Structure

```
kaat-color-multiplayer/
├── server.js              # WebSocket server
├── multiplayer.html       # Multiplayer client
├── index.html            # Single-player version
├── script.js             # Single-player game logic
├── styles.css            # Game styles
├── package.json          # Node.js dependencies
└── MULTIPLAYER_README.md # This file
```

## 🔧 Configuration

### Server Port
The server runs on port 3000 by default. To change it:

1. **Environment variable:**
   ```bash
   PORT=8080 npm start
   ```

2. **Or modify server.js:**
   ```javascript
   const PORT = process.env.PORT || 8080;
   ```

### WebSocket URL
If you change the server port or host, update the WebSocket URL in `multiplayer.html`:

```javascript
const wsUrl = `${protocol}//${host}:${port}`;
```

## 🎮 Game Features

### Multiplayer Features
- ✅ Real-time gameplay
- ✅ Room-based multiplayer
- ✅ Player join/leave notifications
- ✅ Connection status indicator
- ✅ Turn-based card playing
- ✅ Synchronized game state

### Game Rules (Same as Single-player)
- 4 players in 2 teams
- 13 cards per player (5-4-4 dealing)
- Dynamic trump establishment
- Complex trick allocation rules
- Dealer rotation system
- Score tracking (Talents, Coats, Round Wins)

## 🛠️ Troubleshooting

### Connection Issues
1. **Check server is running:**
   ```bash
   npm start
   ```

2. **Check browser console for errors**

3. **Verify WebSocket URL in multiplayer.html**

4. **Check firewall settings**

### Game Issues
1. **Players can't join:**
   - Verify Room ID is correct
   - Check if room is full (max 4 players)

2. **Cards not playing:**
   - Ensure it's your turn
   - Check if card is valid (follow suit rules)

3. **Game not starting:**
   - Need exactly 4 players
   - All players must be connected

## 🌍 Deployment

### Heroku
1. Create a Heroku app
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-app-name
   git push heroku main
   ```

### Railway
1. Connect your GitHub repository
2. Railway will auto-deploy
3. Update WebSocket URL to your Railway domain

### Vercel/Netlify
- These platforms don't support WebSocket servers
- Use a separate WebSocket service (like Railway) for the server
- Host the client files on Vercel/Netlify

## 🔒 Security Considerations

### Production Deployment
- Add input validation
- Implement rate limiting
- Add authentication if needed
- Use HTTPS/WSS in production
- Add error handling for edge cases

### Current Limitations
- No authentication
- No persistent storage
- No anti-cheat measures
- Basic error handling

## 📱 Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ❌ Internet Explorer (no WebSocket support)

## 🎯 Future Enhancements

- [ ] User authentication
- [ ] Persistent game sessions
- [ ] Chat functionality
- [ ] Spectator mode
- [ ] Tournament system
- [ ] Mobile app
- [ ] Sound effects
- [ ] Animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify as needed.

---

**Enjoy playing Kaat Color with friends! 🃏**
