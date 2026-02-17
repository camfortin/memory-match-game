import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, GameMode, ComputerDifficulty } from '../types';
import { Trophy, RotateCcw } from 'lucide-react';
import Card, { CARD_THEMES } from './Card';

interface GameBoardProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  numPairs: number;
  onGameEnd: () => void;
  onGameComplete: () => void;
  selectedTheme: keyof typeof CARD_THEMES;
  gameMode: GameMode;
  computerDifficulty: ComputerDifficulty;
}

interface CardType {
  id: number;
  imageIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  setPlayers,
  numPairs,
  onGameEnd,
  onGameComplete,
  selectedTheme,
  gameMode,
  computerDifficulty
}) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [flippedCards, setFlippedCards] = useState<CardType[]>([]);
  const [matchesThisTurn, setMatchesThisTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showTurnMessage, setShowTurnMessage] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [soloTurns, setSoloTurns] = useState(0);
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  // Computer memory: maps imageIndex -> list of card ids it has seen
  const computerMemory = useRef<Map<number, number[]>>(new Map());
  // Track if computer turn is in progress to prevent re-triggers
  const computerTurnInProgress = useRef(false);

  const isOlympics = selectedTheme === 'olympics';
  const isSolo = gameMode === 'solo';
  const isVsComputer = gameMode === 'vs-computer';
  const isComputerTurn = isVsComputer && currentPlayer === 1;

  // Olympic ring colors for player indicators
  const olympicPlayerColors = [
    { bg: 'bg-blue-600', text: 'text-white', light: 'bg-blue-100' },
    { bg: 'bg-yellow-400', text: 'text-gray-900', light: 'bg-yellow-100' },
    { bg: 'bg-gray-800', text: 'text-white', light: 'bg-gray-200' },
    { bg: 'bg-green-500', text: 'text-white', light: 'bg-green-100' },
    { bg: 'bg-red-500', text: 'text-white', light: 'bg-red-100' },
  ];

  // Initialize game
  useEffect(() => {
    const selectedIndices = Array.from({ length: numPairs }, (_, i) => i);
    const cardPairs = selectedIndices.flatMap((imageIndex) => [
      { id: Math.random(), imageIndex, isFlipped: false, isMatched: false },
      { id: Math.random(), imageIndex, isFlipped: false, isMatched: false }
    ]);
    const shuffledCards = [...cardPairs].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setGameCompleted(false);
    setSoloTurns(0);
    computerMemory.current = new Map();
    computerTurnInProgress.current = false;

    setTimeout(() => {
      setIsInitializing(false);
    }, 100);
  }, [numPairs]);

  // Check for game completion
  useEffect(() => {
    if (!gameCompleted && cards.length > 0 && cards.every((card) => card.isMatched)) {
      setGameOver(true);
      setGameCompleted(true);
      onGameComplete();
    }
  }, [cards, gameCompleted, onGameComplete]);

  // Record a card into computer memory based on difficulty
  const recordToMemory = useCallback((card: CardType) => {
    if (gameMode !== 'vs-computer') return;

    // Decide whether computer remembers this card
    let shouldRemember = false;
    if (computerDifficulty === 'hard') {
      shouldRemember = true;
    } else if (computerDifficulty === 'medium') {
      shouldRemember = Math.random() < 0.5;
    }
    // easy: never remembers

    if (shouldRemember) {
      const existing = computerMemory.current.get(card.imageIndex) || [];
      if (!existing.includes(card.id)) {
        computerMemory.current.set(card.imageIndex, [...existing, card.id]);
      }
    }
  }, [gameMode, computerDifficulty]);

  const handleCardClick = useCallback((clickedCard: CardType) => {
    if (isInitializing || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
      return;
    }
    // Block human clicks during computer's turn
    if (isComputerThinking || isComputerTurn) return;

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    // Record to computer memory when human flips a card
    recordToMemory(clickedCard);

    setFlippedCards(prev => [...prev, clickedCard]);
  }, [flippedCards, isInitializing, isComputerThinking, isComputerTurn, recordToMemory]);

  // Handle match/mismatch resolution
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const isMatch = first.imageIndex === second.imageIndex;

      // Count turn for solo mode
      if (isSolo) {
        setSoloTurns(prev => prev + 1);
      }

      setTimeout(() => {
        setCards(prevCards =>
          prevCards.map(card => {
            if (card.id === first.id || card.id === second.id) {
              return {
                ...card,
                isFlipped: false,
                isMatched: isMatch
              };
            }
            return card;
          })
        );

        setFlippedCards([]);

        if (isMatch) {
          // Remove matched cards from computer memory
          computerMemory.current.delete(first.imageIndex);

          const newPlayers = [...players];
          newPlayers[currentPlayer].score += 1;
          newPlayers[currentPlayer].pairs = [
            ...newPlayers[currentPlayer].pairs,
            CARD_THEMES[selectedTheme][first.imageIndex]
          ];
          setPlayers(newPlayers);

          if (isSolo) {
            // Solo mode: no turn rotation, just keep going
          } else {
            setMatchesThisTurn(prev => {
              const newMatches = prev + 1;
              if (newMatches >= 3) {
                setCurrentPlayer(current => (current + 1) % players.length);
                setShowTurnMessage(true);
                setTimeout(() => setShowTurnMessage(false), 2000);
                return 0;
              }
              return newMatches;
            });
          }
        } else {
          if (!isSolo) {
            setCurrentPlayer(current => (current + 1) % players.length);
            setMatchesThisTurn(0);
            setShowTurnMessage(true);
            setTimeout(() => setShowTurnMessage(false), 2000);
          }
        }

        computerTurnInProgress.current = false;
      }, 1000);
    }
  }, [flippedCards, currentPlayer, players, selectedTheme, setPlayers, isSolo]);

  // Computer AI turn
  useEffect(() => {
    if (!isVsComputer || currentPlayer !== 1 || gameCompleted || isInitializing) return;
    if (flippedCards.length > 0) return;
    if (computerTurnInProgress.current) return;

    computerTurnInProgress.current = true;
    setIsComputerThinking(true);

    const availableCards = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (availableCards.length < 2) {
      computerTurnInProgress.current = false;
      setIsComputerThinking(false);
      return;
    }

    // Computer AI: pick two cards
    const pickCards = (): [CardType, CardType] => {
      // Check memory for known pairs
      for (const [, cardIds] of computerMemory.current.entries()) {
        const available = cardIds.filter(id => {
          const card = cards.find(c => c.id === id);
          return card && !card.isMatched;
        });
        if (available.length >= 2) {
          const card1 = cards.find(c => c.id === available[0])!;
          const card2 = cards.find(c => c.id === available[1])!;
          return [card1, card2];
        }
      }

      // No known pair - pick first card randomly
      const firstCard = availableCards[Math.floor(Math.random() * availableCards.length)];

      // After seeing first card, check if we know where its match is
      const knownForFirst = computerMemory.current.get(firstCard.imageIndex) || [];
      const matchId = knownForFirst.find(id => id !== firstCard.id);
      if (matchId) {
        const matchCard = cards.find(c => c.id === matchId && !c.isMatched);
        if (matchCard) {
          return [firstCard, matchCard];
        }
      }

      // Pick second card randomly (different from first)
      const remaining = availableCards.filter(c => c.id !== firstCard.id);
      const secondCard = remaining[Math.floor(Math.random() * remaining.length)];
      return [firstCard, secondCard];
    };

    const [card1, card2] = pickCards();

    // Animate: flip first card after a delay
    const thinkDelay = 600 + Math.random() * 400;
    setTimeout(() => {
      // Flip first card
      setCards(prev => prev.map(c => c.id === card1.id ? { ...c, isFlipped: true } : c));
      recordToMemory(card1);

      // Flip second card after another delay
      setTimeout(() => {
        setCards(prev => prev.map(c => c.id === card2.id ? { ...c, isFlipped: true } : c));
        recordToMemory(card2);
        setFlippedCards([card1, card2]);
        setIsComputerThinking(false);
      }, 700 + Math.random() * 300);
    }, thinkDelay);
  }, [currentPlayer, isVsComputer, gameCompleted, isInitializing, cards, flippedCards.length, recordToMemory]);

  const getGameResults = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const highestScore = sortedPlayers[0].score;
    const winners = sortedPlayers.filter(player => player.score === highestScore);
    return { winners, sortedPlayers };
  };

  // Assign medal positions (handles ties)
  const getMedalIndex = (sortedPlayers: Player[], playerIndex: number): number | null => {
    if (playerIndex === 0) return 0;
    const prevPlayer = sortedPlayers[playerIndex - 1];
    const currPlayer = sortedPlayers[playerIndex];
    if (currPlayer.score === prevPlayer.score) {
      return getMedalIndex(sortedPlayers, playerIndex - 1);
    }
    return Math.min(playerIndex, 2);
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${
            isOlympics ? 'border-blue-600' : 'border-purple-600'
          }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {showTurnMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base ${
          isOlympics
            ? `${olympicPlayerColors[currentPlayer % olympicPlayerColors.length].bg} text-white`
            : 'bg-purple-600 text-white'
        }`}>
          {players[currentPlayer].name}'s turn!
        </div>
      )}

      {/* Computer thinking indicator */}
      {isComputerThinking && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base bg-gray-700 text-white flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          Computer is thinking...
        </div>
      )}

      {/* Header: stacks cleanly on mobile */}
      <div className="mb-4 sm:mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg sm:text-2xl font-bold truncate mr-2 ${isOlympics ? 'text-blue-600' : 'text-purple-600'}`}>
            {isSolo
              ? `${players[0].name} — Turn ${soloTurns}`
              : `${players[currentPlayer].name}'s turn`}
          </h2>
          <button
            onClick={onGameEnd}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors text-sm shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Start Over</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>

        {/* Score pills */}
        {!isSolo && (
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {players.map((player, index) => {
              const colors = isOlympics
                ? olympicPlayerColors[index % olympicPlayerColors.length]
                : { bg: 'bg-purple-600', text: 'text-white', light: 'bg-gray-100' };
              return (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap shrink-0 ${
                    currentPlayer === index
                      ? `${colors.bg} ${colors.text}`
                      : colors.light
                  }`}
                >
                  {player.name}: {player.score}
                </div>
              );
            })}
          </div>
        )}

        {/* Solo mode: show pairs found */}
        {isSolo && (
          <div className={`flex gap-2 items-center text-sm ${isOlympics ? 'text-blue-600' : 'text-purple-600'}`}>
            <span className="font-medium">{players[0].score} / {numPairs} pairs found</span>
          </div>
        )}
      </div>

      {/* Card grid: 4 cols mobile, 5 cols desktop, tighter gaps on mobile */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8">
        {cards.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            imageIndex={card.imageIndex}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => handleCardClick(card)}
            theme={selectedTheme}
          />
        ))}
      </div>

      {/* Pairs section */}
      <div className={`grid gap-2 sm:gap-4 ${isSolo ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {players.map((player, index) => {
          const colors = isOlympics
            ? olympicPlayerColors[index % olympicPlayerColors.length]
            : { bg: 'bg-purple-600', text: 'text-white', light: 'bg-purple-100' };
          return (
            <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2 text-sm sm:text-base truncate">{player.name}'s Pairs</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {player.pairs.map((emoji, pairIndex) => (
                  <div
                    key={pairIndex}
                    className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg text-2xl sm:text-4xl ${colors.light}`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
            isOlympics ? 'border-t-4 border-yellow-400' : ''
          }`}>
            {isOlympics && (
              <div className="flex justify-center gap-1 text-lg mb-2">
                <span className="text-blue-500">&#9679;</span>
                <span className="text-yellow-400">&#9679;</span>
                <span className="text-gray-800">&#9679;</span>
                <span className="text-green-500">&#9679;</span>
                <span className="text-red-500">&#9679;</span>
              </div>
            )}

            {/* Solo mode end screen */}
            {isSolo ? (
              <>
                <h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center ${
                  isOlympics ? 'text-blue-800' : ''
                }`}>
                  All Pairs Found!
                </h2>
                <div className="text-center space-y-3 mb-6">
                  <div className={`text-4xl sm:text-5xl font-bold ${isOlympics ? 'text-blue-600' : 'text-purple-600'}`}>
                    {soloTurns}
                  </div>
                  <p className="text-gray-600">
                    {soloTurns === 1 ? 'turn' : 'turns'} to complete {numPairs} pairs
                  </p>
                  {soloTurns <= numPairs && (
                    <p className="text-green-600 font-semibold">Perfect memory!</p>
                  )}
                  {soloTurns > numPairs && soloTurns <= numPairs * 1.5 && (
                    <p className="text-green-500 font-medium">Excellent!</p>
                  )}
                  {soloTurns > numPairs * 1.5 && soloTurns <= numPairs * 2 && (
                    <p className="text-yellow-600 font-medium">Good job!</p>
                  )}
                  {soloTurns > numPairs * 2 && (
                    <p className="text-gray-500">Keep practicing!</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Normal / vs-computer end screen */}
                <h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center ${
                  isOlympics ? 'text-blue-800' : ''
                }`}>
                  {isOlympics ? 'Ceremony Time!' : 'Game Over!'}
                </h2>
                {(() => {
                  const { winners, sortedPlayers } = getGameResults();
                  return (
                    <>
                      {winners.length > 1 ? (
                        <p className="mb-4 text-center text-base sm:text-lg">
                          It's a tie between {winners.map(w => w.name).join(' and ')}!
                        </p>
                      ) : (
                        <p className="mb-4 text-center text-base sm:text-lg">
                          {isOlympics ? '🏅' : '🎉'} {winners[0].name} wins{isOlympics ? ' the gold!' : '!'}
                        </p>
                      )}
                      <div className="space-y-2 mb-6">
                        {sortedPlayers.map((player, index) => {
                          const medalIdx = getMedalIndex(sortedPlayers, index);
                          const medal = medalIdx !== null && medalIdx < 3 ? MEDAL_EMOJIS[medalIdx] : null;
                          return (
                            <div key={index} className={`flex items-center gap-3 p-2 rounded-lg ${
                              index === 0 && isOlympics ? 'bg-yellow-50' : ''
                            }`}>
                              <span className="text-xl sm:text-2xl w-8 text-center">
                                {isOlympics && medal ? medal : (
                                  winners.includes(player) ? <Trophy className="text-yellow-500 inline w-5 h-5 sm:w-6 sm:h-6" /> : null
                                )}
                              </span>
                              <span className="font-medium flex-1 truncate">{player.name}</span>
                              <span className="text-gray-600 text-sm sm:text-base shrink-0">{player.score} pairs</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            <button
              onClick={onGameEnd}
              className={`w-full py-3 text-white rounded-lg font-semibold text-lg active:opacity-80 ${
                isOlympics
                  ? 'bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 hover:opacity-90'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSolo
                ? 'Try Again'
                : isOlympics ? 'New Event' : 'Play Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
