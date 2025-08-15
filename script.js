class KaatColorGame {
    constructor() {
        this.deck = [];
        this.players = [
            { id: 1, name: 'You (Player 1)', hand: [], tricks: 0, team: 1 },
            { id: 2, name: 'Player 2', hand: [], tricks: 0, team: 2 },
            { id: 3, name: 'Player 3', hand: [], tricks: 0, team: 1 },
            { id: 4, name: 'Player 4', hand: [], tricks: 0, team: 2 }
        ];
        this.currentPlayer = 0;
        this.currentDealer = 0;
        this.trumpSuit = null;
        this.trumpMakingTeam = null;
        this.leadSuit = null;
        this.currentTrick = [];
        this.trickWinner = null;
        this.consecutiveTricks = { player: null, count: 0 };
        this.trickNumber = 0; // Track current trick number (1-13)
        this.stackedTricks = 0; // Track tricks before trump
        this.freshTricks = 0; // Track tricks after trump but before 2 consecutive
        this.lastTrickWinner = null; // Track who won the last trick
        this.scores = {
            team1: { talents: 0, coats: 0, roundWins: 0 },
            team2: { talents: 0, coats: 0, roundWins: 0 }
        };
        this.teamNames = { team1: 'Team 1', team2: 'Team 2' };
        this.gameState = 'waiting'; // waiting, dealing, playing, roundEnd
        this.gameStarted = false; // Track if a game has been started
        this.initializeDeck();
        this.setupEventListeners();
        this.updateDisplay();
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
        const dealOrder = [0, 1, 2, 3]; // Start from dealer
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
        this.trickNumber = 0; // Reset trick number for new round
        this.stackedTricks = 0; // Reset stacked tricks
        this.freshTricks = 0; // Reset fresh tricks
        this.lastTrickWinner = null; // Reset last trick winner
        this.gameState = 'playing';
    }

    canFollowSuit(player, leadSuit) {
        return player.hand.some(card => card.suit === leadSuit);
    }

    getValidMoves(player) {
        if (this.currentTrick.length === 0) {
            // Leading - can play any card
            return player.hand;
        }

        const leadSuit = this.currentTrick[0].card.suit;
        const canFollow = this.canFollowSuit(player, leadSuit);

        if (canFollow) {
            // Must follow suit
            return player.hand.filter(card => card.suit === leadSuit);
        } else {
            // Can't follow suit - can play any card
            return player.hand;
        }
    }

    determineTrickWinner() {
        if (this.currentTrick.length !== 4) return null;

        let winningTrick = this.currentTrick[0];
        let winningPlayer = winningTrick.player;

        // Check each card played after the lead
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

        // If trump is established
        if (this.trumpSuit) {
            // Trump cards beat non-trump cards
            if (card1IsTrump && !card2IsTrump) return true;
            if (!card1IsTrump && card2IsTrump) return false;
            
            // If both are trump, higher value wins
            if (card1IsTrump && card2IsTrump) {
                return card1.numericValue > card2.numericValue;
            }
        }

        // If no trump or neither card is trump, follow lead suit
        if (card1FollowsLead && !card2FollowsLead) return true;
        if (!card1FollowsLead && card2FollowsLead) return false;
        
        // If both follow lead suit, higher value wins
        if (card1FollowsLead && card2FollowsLead) {
            return card1.numericValue > card2.numericValue;
        }

        // If neither follows lead suit and no trump, first card wins
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
            // Trump is being established
            this.trumpSuit = card.suit;
            this.trumpMakingTeam = player.team;
            this.showMessage(`Trump established: ${this.trumpSuit} by ${this.players[playerIndex].name}`);
            this.updateDisplay();
        }

        // Check if trick is complete
        if (this.currentTrick.length === 4) {
            this.trickWinner = this.determineTrickWinner();
            
            if (this.trumpSuit === null) {
                // Before trump - just stack the trick
                this.stackedTricks++;
                this.showMessage(`Trick ${this.trickNumber + 1}: ${this.players[this.trickWinner].name} wins (stacked until trump is established)`);
            } else {
                // After trump - process according to consecutive rules
                // Check if this is the trick where trump was just established
                const trumpEstablishedThisTrick = this.currentTrick.some(trick => 
                    trick.card.suit === this.trumpSuit && trick.card.suit !== this.leadSuit
                );
                
                // All tricks after trump count as fresh tricks
                this.freshTricks++;
                
                if (trumpEstablishedThisTrick) {
                    this.showMessage(`Trick ${this.trickNumber + 1}: ${this.players[this.trickWinner].name} wins (trump established: ${this.trumpSuit})`);
                }
                
                if (this.consecutiveTricks.player === this.trickWinner) {
                    this.consecutiveTricks.count++;
                    
                    if (this.consecutiveTricks.count >= 2) {
                        // Player wins 2 consecutive tricks - award all stacked and fresh tricks
                        const totalTricksToAward = this.stackedTricks + this.freshTricks;
                        this.players[this.trickWinner].tricks += totalTricksToAward;
                        
                        this.showMessage(`Trick ${this.trickNumber + 1}: ${this.players[this.trickWinner].name} wins 2 consecutive tricks! Awarded ${totalTricksToAward} tricks (${this.stackedTricks} stacked + ${this.freshTricks} fresh)`);
                        
                        // Reset for fresh start
                        this.stackedTricks = 0;
                        this.freshTricks = 0;
                        this.consecutiveTricks = { player: null, count: 0 };
                    } else {
                        this.showMessage(`Trick ${this.trickNumber + 1}: ${this.players[this.trickWinner].name} wins the trick! (${this.consecutiveTricks.count} consecutive)`);
                    }
                } else {
                    // New player wins - reset consecutive count
                    this.consecutiveTricks.player = this.trickWinner;
                    this.consecutiveTricks.count = 1;
                    if (!trumpEstablishedThisTrick) {
                        this.showMessage(`Trick ${this.trickNumber + 1}: ${this.players[this.trickWinner].name} wins the trick!`);
                    }
                }
            }

            // Store last trick winner for final allocation
            this.lastTrickWinner = this.trickWinner;

            // Increment trick number after processing the trick
            this.trickNumber++;

            // Clear current trick and set next player
            this.currentTrick = [];
            this.currentPlayer = this.trickWinner;
            this.leadSuit = null;

            // Check if all cards are played - this is the main ending condition
            if (this.players.every(p => p.hand.length === 0)) {
                // Allocate any remaining unallocated tricks to last winner
                if (this.stackedTricks > 0 || this.freshTricks > 0) {
                    const remainingTricks = this.stackedTricks + this.freshTricks;
                    this.players[this.lastTrickWinner].tricks += remainingTricks;
                    this.showMessage(`Final allocation: ${this.players[this.lastTrickWinner].name} gets ${remainingTricks} remaining tricks`);
                }
                
                this.showMessage(`All 13 tricks played! Round ends.`);
                this.endRound();
                return true;
            }
        } else {
            this.currentPlayer = (this.currentPlayer + 1) % 4;
        }

        this.updateDisplay();
        return true;
    }

    aiPlayCard(playerIndex) {
        const player = this.players[playerIndex];
        const validMoves = this.getValidMoves(player);

        if (validMoves.length === 0) return false;

        // Simple AI: play the highest card from valid moves
        let bestCard = validMoves[0];
        let bestCardIndex = player.hand.indexOf(bestCard);

        for (let i = 1; i < validMoves.length; i++) {
            const card = validMoves[i];
            if (card.numericValue > bestCard.numericValue) {
                bestCard = card;
                bestCardIndex = player.hand.indexOf(card);
            }
        }

        return this.playCard(playerIndex, bestCardIndex);
    }

    endRound() {
        this.gameState = 'roundEnd';
        
        const team1Tricks = this.players[0].tricks + this.players[2].tricks;
        const team2Tricks = this.players[1].tricks + this.players[3].tricks;

        // Determine winner based on total tricks won
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
                // Trump-making team wins
                this.scores[`team${this.trumpMakingTeam}`].roundWins++;
                if (trumpTeamTricks === 13) {
                    // Give a coat to opposing team
                    if (this.trumpMakingTeam === 1) {
                        this.scores.team2.coats++;
                    } else {
                        this.scores.team1.coats++;
                    }
                    this.showMessage(`${this.teamNames[`team${this.trumpMakingTeam}`]} wins with all 13 tricks! Coat given to opposing team.`);
                } else {
                    this.showMessage(`${this.teamNames[`team${this.trumpMakingTeam}`]} wins with ${trumpTeamTricks} tricks!`);
                }
            } else if (winningTeam) {
                // Opposing team wins
                const opposingTeamNumber = this.trumpMakingTeam === 1 ? 2 : 1;
                this.scores[`team${opposingTeamNumber}`].roundWins++;
                if (opposingTeamTricks === 13) {
                    // Give a talent to trump-making team
                    if (this.trumpMakingTeam === 1) {
                        this.scores.team1.talents++;
                    } else {
                        this.scores.team2.talents++;
                    }
                    this.showMessage(`${this.teamNames[`team${opposingTeamNumber}`]} wins with all 13 tricks! Talent given to trump-making team.`);
                } else {
                    this.showMessage(`${this.teamNames[`team${opposingTeamNumber}`]} wins with ${opposingTeamTricks} tricks!`);
                }
            }
        } else {
            if (winningTeam) {
                this.scores[`team${winningTeam}`].roundWins++;
                this.showMessage(`${this.teamNames[`team${winningTeam}`]} wins with ${winningTricks} tricks!`);
            } else {
                this.showMessage("Round ends in a draw.");
            }
        }

        const previousDealer = this.currentDealer;
        this.determineNextDealer();
        
        if (previousDealer !== this.currentDealer) {
            this.showMessage(`${this.players[previousDealer].name} was dealer. Next dealer: ${this.players[this.currentDealer].name}`);
        }
        
        this.updateDisplay();
    }

        determineNextDealer() {
        const team1Tricks = this.players[0].tricks + this.players[2].tricks;
        const team2Tricks = this.players[1].tricks + this.players[3].tricks;
        const currentDealerTeam = this.players[this.currentDealer].team;
        
        // Get the dealer's team tricks and opposing team tricks
        const dealerTeamTricks = currentDealerTeam === 1 ? team1Tricks : team2Tricks;
        const opposingTeamTricks = currentDealerTeam === 1 ? team2Tricks : team1Tricks;
        
        // Determine which team won (most tricks)
        const dealerTeamWon = dealerTeamTricks > opposingTeamTricks;
        const opposingTeamWon = opposingTeamTricks > dealerTeamTricks;

        if (dealerTeamWon) {
            if (dealerTeamTricks === 13) {
                // Dealer's team wins with all 13 tricks - previous player (counter-clockwise) becomes dealer
                this.currentDealer = this.currentDealer === 0 ? 3 : this.currentDealer - 1;
            } else {
                // Dealer's team wins with 7+ tricks but not all 13 - clockwise next player becomes dealer
                this.currentDealer = (this.currentDealer + 1) % 4;
            }
        } else if (opposingTeamWon) {
            if (opposingTeamTricks === 13) {
                // Opposing team wins with all 13 tricks - second player of dealer's team becomes dealer
                if (currentDealerTeam === 1) {
                    // Dealer is on Team 1 (Player 0 or 2) - second player is Player 2
                    this.currentDealer = this.currentDealer === 0 ? 2 : 0;
                } else {
                    // Dealer is on Team 2 (Player 1 or 3) - second player is Player 3
                    this.currentDealer = this.currentDealer === 1 ? 3 : 1;
                }
            } else {
                // Opposing team wins with 7+ tricks but not all 13 - same dealer continues
                // No change needed
            }
        } else {
            // No clear winner (tie) - dealer stays the same
        }
    }

    startNewRound() {
        this.dealCards();
        this.gameState = 'playing';
        this.showMessage("New round started! Cards dealt.");
        this.updateDisplay();
    }

    startNewGame() {
        this.scores = { team1: { talents: 0, coats: 0, roundWins: 0 }, team2: { talents: 0, coats: 0, roundWins: 0 } };
        // Random dealer selection for first round
        this.currentDealer = Math.floor(Math.random() * 4);
        this.gameStarted = true; // Mark that a game has been started
        this.startNewRound();
    }

    createCardElement(card, isPlayable = false, isSelected = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.isRed ? 'red' : 'black'}`;
        if (isPlayable) cardDiv.classList.add('playable');
        if (isSelected) cardDiv.classList.add('selected');

        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${card.suit}</div>
        `;

        return cardDiv;
    }

    updateDisplay() {
        // Update game info
        document.getElementById('trump-suit').textContent = this.trumpSuit || 'None';
        document.getElementById('current-player').textContent = this.players[this.currentPlayer].name;
        document.getElementById('current-dealer').textContent = this.players[this.currentDealer].name;
        document.getElementById('current-trick').textContent = `${this.trickNumber}/13`;

        // Update scores
        document.getElementById('team1-talents').textContent = this.scores.team1.talents;
        document.getElementById('team1-coats').textContent = this.scores.team1.coats;
        document.getElementById('team1-round-wins').textContent = this.scores.team1.roundWins;
        document.getElementById('team2-talents').textContent = this.scores.team2.talents;
        document.getElementById('team2-coats').textContent = this.scores.team2.coats;
        document.getElementById('team2-round-wins').textContent = this.scores.team2.roundWins;

        // Update team names in scoreboard
        document.querySelector('.team-1 h3').textContent = `${this.teamNames.team1} (${this.players[0].name} & ${this.players[2].name})`;
        document.querySelector('.team-2 h3').textContent = `${this.teamNames.team2} (${this.players[1].name} & ${this.players[3].name})`;

        // Update player tricks
        this.players.forEach((player, index) => {
            const tricksElement = document.getElementById(`player${player.id}-tricks`);
            if (this.gameState === 'roundEnd') {
                // Round has ended - show only final trick count
                tricksElement.textContent = `${player.tricks}`;
                tricksElement.style.color = '#333';
            } else if (this.trumpSuit === null) {
                // Show stacked tricks before trump is established
                tricksElement.textContent = `${player.tricks} (stacked: ${this.stackedTricks})`;
                tricksElement.style.color = '#999';
            } else {
                // After trump is established, show both stacked and fresh tricks
                const stackedText = this.stackedTricks > 0 ? ` (stacked: ${this.stackedTricks})` : '';
                const freshText = this.freshTricks > 0 ? ` (fresh: ${this.freshTricks})` : '';
                tricksElement.textContent = `${player.tricks}${stackedText}${freshText}`;
                tricksElement.style.color = '#333';
            }
        });

        // Update round info
        const team1Tricks = this.players[0].tricks + this.players[2].tricks;
        const team2Tricks = this.players[1].tricks + this.players[3].tricks;
        document.getElementById('team1-round-tricks').textContent = team1Tricks;
        document.getElementById('team2-round-tricks').textContent = team2Tricks;
        document.getElementById('trump-making-team').textContent = this.trumpMakingTeam ? `Team ${this.trumpMakingTeam}` : 'None';

                // Update hands and current turn highlighting
        this.players.forEach((player, playerIndex) => {
            const handElement = document.getElementById(`player${player.id}-hand`);
            const playerArea = handElement.closest('.player-area');
            const playerInfo = playerArea.querySelector('.player-info h3');
            
            // Update current turn highlighting
            if (playerIndex === this.currentPlayer && this.gameState === 'playing') {
                playerArea.classList.add('current-turn');
                playerInfo.innerHTML = `${player.name} <span style="color: #4CAF50; font-size: 0.8em;">(Your Turn!)</span>`;
            } else {
                playerArea.classList.remove('current-turn');
                playerInfo.innerHTML = player.name;
            }
            
            handElement.innerHTML = '';

            if (this.gameState === 'waiting') {
                // Show card backs
                for (let i = 0; i < 13; i++) {
                    const cardBack = document.createElement('div');
                    cardBack.className = 'card card-back';
                    cardBack.innerHTML = '🂠';
                    handElement.appendChild(cardBack);
                }
            } else {
                // Show actual cards
                player.hand.forEach((card, cardIndex) => {
                    const isCurrentPlayer = playerIndex === this.currentPlayer;
                    const validMoves = this.getValidMoves(player);
                    const isPlayable = isCurrentPlayer && this.gameState === 'playing' && validMoves.includes(card);
                    
                    const cardElement = this.createCardElement(card, isPlayable);
                    
                    if (isPlayable) {
                        cardElement.addEventListener('click', () => {
                            this.playCard(playerIndex, cardIndex);
                        });
                    }
                    
                    handElement.appendChild(cardElement);
                });
            }
        });

        // Update trick pile
        const trickPile = document.getElementById('trick-pile');
        trickPile.innerHTML = '';

        if (this.currentTrick.length === 0) {
            trickPile.innerHTML = '<div style="color: #999; font-style: italic;">No cards played yet</div>';
        } else {
            this.currentTrick.forEach((trick, index) => {
                const cardElement = this.createCardElement(trick.card);
                cardElement.style.transform = `rotate(${index * 15 - 22.5}deg)`;
                trickPile.appendChild(cardElement);
            });
        }

        // Highlight trump suit
        const trumpElement = document.getElementById('trump-suit');
        if (this.trumpSuit) {
            trumpElement.classList.add('active');
        } else {
            trumpElement.classList.remove('active');
        }

        // Update button visibility based on game state
        const newRoundBtn = document.getElementById('new-round-btn');
        const newGameBtn = document.getElementById('new-game-btn');
        
        if (this.gameStarted) {
            // Game has been started - show New Round, hide New Game during play
            newRoundBtn.classList.remove('hidden');
            newGameBtn.classList.add('hidden'); // Always hide New Game after game starts
        } else {
            // No game started yet - show only New Game
            newRoundBtn.classList.add('hidden');
            newGameBtn.classList.remove('hidden');
        }
    }

    showMessage(message) {
        const messageElement = document.getElementById('game-messages');
        messageElement.textContent = message;
    }

    setupEventListeners() {
        document.getElementById('new-round-btn').addEventListener('click', () => {
            this.startNewRound();
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showTeamSetupModal();
        });

        // Modal event listeners
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideTeamSetupModal();
        });

        document.getElementById('cancel-setup-btn').addEventListener('click', () => {
            this.hideTeamSetupModal();
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.applyTeamSetup();
        });

        // Close modal when clicking outside
        document.getElementById('team-setup-modal').addEventListener('click', (e) => {
            if (e.target.id === 'team-setup-modal') {
                this.hideTeamSetupModal();
            }
        });
    }

    showTeamSetupModal() {
        // Populate modal with current names
        document.getElementById('team1-name').value = this.teamNames.team1;
        document.getElementById('team2-name').value = this.teamNames.team2;
        document.getElementById('player1-name').value = this.players[0].name;
        document.getElementById('player2-name').value = this.players[1].name;
        document.getElementById('player3-name').value = this.players[2].name;
        document.getElementById('player4-name').value = this.players[3].name;
        
        document.getElementById('team-setup-modal').style.display = 'block';
    }

    hideTeamSetupModal() {
        document.getElementById('team-setup-modal').style.display = 'none';
    }

    applyTeamSetup() {
        // Get values from modal
        const team1Name = document.getElementById('team1-name').value.trim() || 'Team 1';
        const team2Name = document.getElementById('team2-name').value.trim() || 'Team 2';
        const player1Name = document.getElementById('player1-name').value.trim() || 'You (Player 1)';
        const player2Name = document.getElementById('player2-name').value.trim() || 'Player 2';
        const player3Name = document.getElementById('player3-name').value.trim() || 'Player 3';
        const player4Name = document.getElementById('player4-name').value.trim() || 'Player 4';

        // Update team names
        this.teamNames.team1 = team1Name;
        this.teamNames.team2 = team2Name;

        // Update player names
        this.players[0].name = player1Name;
        this.players[1].name = player2Name;
        this.players[2].name = player3Name;
        this.players[3].name = player4Name;

        // Hide modal and start new game
        this.hideTeamSetupModal();
        this.startNewGame();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new KaatColorGame();
    game.showMessage("Welcome to Kaat Color! Click 'New Game' to start playing.");
});
