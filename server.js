const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game rooms
const rooms = new Map();
const players = new Map();

// Game state for each room
class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.gameState = 'waiting'; // waiting, playing, roundEnd
        this.currentPlayer = 0;
        this.currentDealer = 0;
        this.trumpSuit = null;
        this.trumpMakingTeam = null;
        this.leadSuit = null;
        this.currentTrick = [];
        this.trickWinner = null;
        this.consecutiveTricks = { player: null, count: 0 };
        this.trickNumber = 0;
        this.stackedTricks = 0;
        this.freshTricks = 0;
        this.lastTrickWinner = null;
        this.scores = {
            team1: { talents: 0, coats: 0, roundWins: 0 },
            team2: { talents: 0, coats: 0, roundWins: 0 }
        };
        this.teamNames = { team1: 'Team 1', team2: 'Team 2' };
        this.gameStarted = false;
        this.deck = [];
        this.initializeDeck();
    }

    initializeDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit: suit,
                    value: value,
                    isRed: suit === '♥' || suit === '♦',
                    numericValue: this.getNumericValue(value)
                });
            }
        }
    }

    getNumericValue(value) {
        const valueMap = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return valueMap[value];
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        this.shuffleDeck();
        
        // Clear all hands
        this.players.forEach(player => {
            player.hand = [];
            player.tricks = 0;
        });

        // Deal in 5-4-4 format
        const dealOrder = [0, 1, 2, 3];
        let cardIndex = 0;

        // Deal 5 cards to each player
        for (let round = 0; round < 5; round++) {
            for (let playerIndex of dealOrder) {
                if (cardIndex < this.deck.length) {
                    this.players[playerIndex].hand.push(this.deck[cardIndex++]);
                }
            }
        }

        // Deal 4 more cards to each player
        for (let round = 0; round < 4; round++) {
            for (let playerIndex of dealOrder) {
                if (cardIndex < this.deck.length) {
                    this.players[playerIndex].hand.push(this.deck[cardIndex++]);
                }
            }
        }

        // Deal 4 more cards to each player (third round)
        for (let round = 0; round < 4; round++) {
            for (let playerIndex of dealOrder) {
                if (cardIndex < this.deck.length) {
                    this.players[playerIndex].hand.push(this.deck[cardIndex++]);
                }
            }
        }

        // Sort hands by suit and value
        this.players.forEach(player => {
            player.hand.sort((a, b) => {
                if (a.suit !== b.suit) {
                    return a.suit.localeCompare(b.suit);
                }
                return b.numericValue - a.numericValue;
            });
        });

        this.currentPlayer = (this.currentDealer + 1) % 4;
        this.trumpSuit = null;
        this.trumpMakingTeam = null;
        this.leadSuit = null;
        this.currentTrick = [];
        this.trickWinner = null;
        this.consecutiveTricks = { player: null, count: 0 };
        this.trickNumber = 0;
        this.stackedTricks = 0;
        this.freshTricks = 0;
        this.lastTrickWinner = null;
        this.gameState = 'playing';
    }

    canFollowSuit(player, leadSuit) {
        return player.hand.some(card => card.suit === leadSuit);
    }

    getValidMoves(player) {
        if (this.currentTrick.length === 0) {
            return player.hand;
        }

        const leadSuit = this.currentTrick[0].card.suit;
        const canFollow = this.canFollowSuit(player, leadSuit);

        if (canFollow) {
            return player.hand.filter(card => card.suit === leadSuit);
        } else {
            return player.hand;
        }
    }

    determineTrickWinner() {
        if (this.currentTrick.length !== 4) return null;

        let winningTrick = this.currentTrick[0];
        let winningPlayer = winningTrick.player;

        for (let i = 1; i < this.currentTrick.length; i++) {
            const trick = this.currentTrick[i];
            
            if (this.isCardHigher(trick.card, winningTrick.card)) {
                winningTrick = trick;
                winningPlayer = trick.player;
            }
        }

        return winningPlayer;
    }

    isCardHigher(card1, card2) {
        const leadSuit = this.currentTrick[0].card.suit;
        const card1FollowsLead = card1.suit === leadSuit;
        const card2FollowsLead = card2.suit === leadSuit;
        const card1IsTrump = this.trumpSuit && card1.suit === this.trumpSuit;
        const card2IsTrump = this.trumpSuit && card2.suit === this.trumpSuit;

        if (this.trumpSuit) {
            if (card1IsTrump && !card2IsTrump) return true;
            if (!card1IsTrump && card2IsTrump) return false;
            
            if (card1IsTrump && card2IsTrump) {
                return card1.numericValue > card2.numericValue;
            }
        }

        if (card1FollowsLead && !card2FollowsLead) return true;
        if (!card1FollowsLead && card2FollowsLead) return false;
        
        if (card1FollowsLead && card2FollowsLead) {
            return card1.numericValue > card2.numericValue;
        }

        return false;
    }

    playCard(playerIndex, cardIndex) {
        const player = this.players[playerIndex];
        const validMoves = this.getValidMoves(player);

        if (cardIndex < 0 || cardIndex >= player.hand.length) return false;

        const card = player.hand[cardIndex];
        const isValidMove = validMoves.includes(card);

        if (!isValidMove) return false;

        // Remove card from hand
        player.hand.splice(cardIndex, 1);

        // Add to current trick with player info
        this.currentTrick.push({
            card: card,
            player: playerIndex
        });

        // Check if trump is being established
        if (this.currentTrick.length === 1) {
            this.leadSuit = card.suit;
        } else if (this.trumpSuit === null && card.suit !== this.leadSuit) {
            this.trumpSuit = card.suit;
            this.trumpMakingTeam = player.team;
        }

        // Check if trick is complete
        if (this.currentTrick.length === 4) {
            this.trickWinner = this.determineTrickWinner();
            
            if (this.trumpSuit === null) {
                this.stackedTricks++;
            } else {
                const trumpEstablishedThisTrick = this.currentTrick.some(trick => 
                    trick.card.suit === this.trumpSuit && trick.card.suit !== this.leadSuit
                );
                
                this.freshTricks++;
                
                if (this.consecutiveTricks.player === this.trickWinner) {
                    this.consecutiveTricks.count++;
                    
                    if (this.consecutiveTricks.count >= 2) {
                        const totalTricksToAward = this.stackedTricks + this.freshTricks;
                        this.players[this.trickWinner].tricks += totalTricksToAward;
                        
                        this.stackedTricks = 0;
                        this.freshTricks = 0;
                        this.consecutiveTricks = { player: null, count: 0 };
                    }
                } else {
                    this.consecutiveTricks.player = this.trickWinner;
                    this.consecutiveTricks.count = 1;
                }
            }

            this.lastTrickWinner = this.trickWinner;
            this.trickNumber++;

            this.currentTrick = [];
            this.currentPlayer = this.trickWinner;
            this.leadSuit = null;

            if (this.players.every(p => p.hand.length === 0)) {
                if (this.stackedTricks > 0 || this.freshTricks > 0) {
                    const remainingTricks = this.stackedTricks + this.freshTricks;
                    this.players[this.lastTrickWinner].tricks += remainingTricks;
                }
                
                this.endRound();
                return true;
            }
        } else {
            this.currentPlayer = (this.currentPlayer + 1) % 4;
        }

        return true;
    }

    endRound() {
        this.gameState = 'roundEnd';
        
        const team1Tricks = this.players[0].tricks + this.players[2].tricks;
        const team2Tricks = this.players[1].tricks + this.players[3].tricks;

        let winningTeam = null;
        let winningTricks = 0;
        
        if (team1Tricks > team2Tricks) {
            winningTeam = 1;
            winningTricks = team1Tricks;
        } else if (team2Tricks > team1Tricks) {
            winningTeam = 2;
            winningTricks = team2Tricks;
        }

        if (this.trumpMakingTeam) {
            const trumpTeamTricks = this.trumpMakingTeam === 1 ? team1Tricks : team2Tricks;
            const opposingTeamTricks = this.trumpMakingTeam === 1 ? team2Tricks : team1Tricks;

            if (winningTeam === this.trumpMakingTeam) {
                this.scores[`team${this.trumpMakingTeam}`].roundWins++;
                if (trumpTeamTricks === 13) {
                    if (this.trumpMakingTeam === 1) {
                        this.scores.team2.coats++;
                    } else {
                        this.scores.team1.coats++;
                    }
                }
            } else if (winningTeam) {
                const opposingTeamNumber = this.trumpMakingTeam === 1 ? 2 : 1;
                this.scores[`team${opposingTeamNumber}`].roundWins++;
                if (opposingTeamTricks === 13) {
                    if (this.trumpMakingTeam === 1) {
                        this.scores.team1.talents++;
                    } else {
                        this.scores.team2.talents++;
                    }
                }
            }
        } else {
            if (winningTeam) {
                this.scores[`team${winningTeam}`].roundWins++;
            }
        }

        this.determineNextDealer();
    }

    determineNextDealer() {
        const team1Tricks = this.players[0].tricks + this.players[2].tricks;
        const team2Tricks = this.players[1].tricks + this.players[3].tricks;
        const currentDealerTeam = this.players[this.currentDealer].team;
        
        const dealerTeamTricks = currentDealerTeam === 1 ? team1Tricks : team2Tricks;
        const opposingTeamTricks = currentDealerTeam === 1 ? team2Tricks : team1Tricks;
        
        const dealerTeamWon = dealerTeamTricks > opposingTeamTricks;
        const opposingTeamWon = opposingTeamTricks > dealerTeamTricks;

        if (dealerTeamWon) {
            if (dealerTeamTricks === 13) {
                this.currentDealer = this.currentDealer === 0 ? 3 : this.currentDealer - 1;
            } else {
                this.currentDealer = (this.currentDealer + 1) % 4;
            }
        } else if (opposingTeamWon) {
            if (opposingTeamTricks === 13) {
                if (currentDealerTeam === 1) {
                    this.currentDealer = this.currentDealer === 0 ? 2 : 0;
                } else {
                    this.currentDealer = this.currentDealer === 1 ? 3 : 1;
                }
            }
        }
    }

    startNewRound() {
        this.dealCards();
        this.gameState = 'playing';
    }

    startNewGame() {
        this.scores = { team1: { talents: 0, coats: 0, roundWins: 0 }, team2: { talents: 0, coats: 0, roundWins: 0 } };
        this.currentDealer = Math.floor(Math.random() * 4);
        this.gameStarted = true;
        this.startNewRound();
    }

    getGameState() {
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                team: p.team,
                tricks: p.tricks,
                hand: p.hand
            })),
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            currentDealer: this.currentDealer,
            trumpSuit: this.trumpSuit,
            trumpMakingTeam: this.trumpMakingTeam,
            currentTrick: this.currentTrick,
            trickNumber: this.trickNumber,
            stackedTricks: this.stackedTricks,
            freshTricks: this.freshTricks,
            scores: this.scores,
            teamNames: this.teamNames,
            gameStarted: this.gameStarted
        };
    }
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleDisconnect(ws);
    });
});

function handleMessage(ws, data) {
    switch (data.type) {
        case 'join_room':
            handleJoinRoom(ws, data);
            break;
        case 'create_room':
            handleCreateRoom(ws, data);
            break;
        case 'play_card':
            handlePlayCard(ws, data);
            break;
        case 'start_game':
            handleStartGame(ws, data);
            break;
        case 'start_new_round':
            handleStartNewRound(ws, data);
            break;
        case 'update_team_names':
            handleUpdateTeamNames(ws, data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function handleJoinRoom(ws, data) {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }

    if (room.players.length >= 4) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full'
        }));
        return;
    }

    const player = {
        id: room.players.length + 1,
        name: playerName,
        hand: [],
        tricks: 0,
        team: room.players.length < 2 ? 1 : 2,
        ws: ws
    };

    room.players.push(player);
    players.set(ws, { roomId, playerId: player.id });

    // Notify all players in the room
    broadcastToRoom(roomId, {
        type: 'player_joined',
        player: { id: player.id, name: player.name, team: player.team },
        gameState: room.getGameState()
    });

    console.log(`Player ${playerName} joined room ${roomId}`);
}

function handleCreateRoom(ws, data) {
    const roomId = generateRoomId();
    const room = new GameRoom(roomId);
    rooms.set(roomId, room);

    ws.send(JSON.stringify({
        type: 'room_created',
        roomId: roomId
    }));

    console.log(`Room ${roomId} created`);
}

function handlePlayCard(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;

    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    const { cardIndex } = data;
    const playerIndex = room.players.findIndex(p => p.id === playerInfo.playerId);
    
    if (playerIndex === -1 || playerIndex !== room.currentPlayer) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not your turn'
        }));
        return;
    }

    const success = room.playCard(playerIndex, cardIndex);
    
    if (success) {
        broadcastToRoom(playerInfo.roomId, {
            type: 'game_state_update',
            gameState: room.getGameState()
        });
    } else {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid move'
        }));
    }
}

function handleStartGame(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;

    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    if (room.players.length !== 4) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Need 4 players to start'
        }));
        return;
    }

    room.startNewGame();
    
    broadcastToRoom(playerInfo.roomId, {
        type: 'game_started',
        gameState: room.getGameState()
    });
}

function handleStartNewRound(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;

    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    room.startNewRound();
    
    broadcastToRoom(playerInfo.roomId, {
        type: 'new_round_started',
        gameState: room.getGameState()
    });
}

function handleUpdateTeamNames(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;

    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    const { teamNames, playerNames } = data;
    
    if (teamNames) {
        room.teamNames = teamNames;
    }
    
    if (playerNames) {
        playerNames.forEach((name, index) => {
            if (room.players[index]) {
                room.players[index].name = name;
            }
        });
    }
    
    broadcastToRoom(playerInfo.roomId, {
        type: 'team_names_updated',
        gameState: room.getGameState()
    });
}

function handleDisconnect(ws) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;

    const room = rooms.get(playerInfo.roomId);
    if (!room) return;

    // Remove player from room
    const playerIndex = room.players.findIndex(p => p.id === playerInfo.playerId);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
    }

    players.delete(ws);

    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(playerInfo.roomId);
        console.log(`Room ${playerInfo.roomId} deleted (empty)`);
    } else {
        // Notify remaining players
        broadcastToRoom(playerInfo.roomId, {
            type: 'player_left',
            playerId: playerInfo.playerId,
            gameState: room.getGameState()
        });
    }
}

function broadcastToRoom(roomId, message) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.players.forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
