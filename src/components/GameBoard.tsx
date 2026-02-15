import React, { useState, useEffect, useCallback } from 'react';
import { Player } from '../types';
import { Trophy, Medal, RotateCcw } from 'lucide-react';
import Card, { CARD_THEMES } from './Card';

interface GameBoardProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  numPairs: number;
  onGameEnd: () => void;
  onGameComplete: () => void;
  selectedTheme: keyof typeof CARD_THEMES;
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
  selectedTheme
}) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [flippedCards, setFlippedCards] = useState<CardType[]>([]);
  const [matchesThisTurn, setMatchesThisTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showTurnMessage, setShowTurnMessage] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const isOlympics = selectedTheme === 'olympics';

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

  const handleCardClick = useCallback((clickedCard: CardType) => {
    if (isInitializing || clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
      return;
    }

    setCards(prevCards =>
      prevCards.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    setFlippedCards(prev => [...prev, clickedCard]);
  }, [flippedCards, isInitializing]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const isMatch = first.imageIndex === second.imageIndex;

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
          const newPlayers = [...players];
          newPlayers[currentPlayer].score += 1;
          newPlayers[currentPlayer].pairs = [
            ...newPlayers[currentPlayer].pairs,
            CARD_THEMES[selectedTheme][first.imageIndex]
          ];
          setPlayers(newPlayers);

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
        } else {
          setCurrentPlayer(current => (current + 1) % players.length);
          setMatchesThisTurn(0);
          setShowTurnMessage(true);
          setTimeout(() => setShowTurnMessage(false), 2000);
        }
      }, 1000);
    }
  }, [flippedCards, currentPlayer, players, selectedTheme, setPlayers]);

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
      // Same medal as previous
      return getMedalIndex(sortedPlayers, playerIndex - 1);
    }
    return Math.min(playerIndex, 2);
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${
            isOlympics ? 'border-blue-600' : 'border-purple-600'
          }`}></div>
        </div>
      </div>
    );
  }

  const currentColors = isOlympics
    ? olympicPlayerColors[currentPlayer % olympicPlayerColors.length]
    : { bg: 'bg-purple-600', text: 'text-white', light: 'bg-purple-100' };

  return (
    <div className="container mx-auto px-4 py-8">
      {showTurnMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
          isOlympics
            ? `${olympicPlayerColors[currentPlayer % olympicPlayerColors.length].bg} text-white`
            : 'bg-purple-600 text-white'
        }`}>
          {players[currentPlayer].name}'s turn!
        </div>
      )}

      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <h2 className={`text-2xl font-bold ${isOlympics ? 'text-blue-600' : 'text-purple-600'}`}>
          {players[currentPlayer].name}'s turn
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onGameEnd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
          <div className="flex gap-2 flex-wrap">
            {players.map((player, index) => {
              const colors = isOlympics
                ? olympicPlayerColors[index % olympicPlayerColors.length]
                : { bg: 'bg-purple-600', text: 'text-white', light: 'bg-gray-100' };
              return (
                <div
                  key={index}
                  className={`px-4 py-2 rounded-lg font-medium ${
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
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
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

      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(players.length, 5)}, minmax(0, 1fr))` }}>
        {players.map((player, index) => {
          const colors = isOlympics
            ? olympicPlayerColors[index % olympicPlayerColors.length]
            : { bg: 'bg-purple-600', text: 'text-white', light: 'bg-purple-100' };
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">{player.name}'s Pairs</h3>
              <div className="flex flex-wrap gap-2">
                {player.pairs.map((emoji, pairIndex) => (
                  <div
                    key={pairIndex}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg text-4xl ${colors.light}`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 ${
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
            <h2 className={`text-2xl font-bold mb-4 text-center ${
              isOlympics ? 'text-blue-800' : ''
            }`}>
              {isOlympics ? 'Ceremony Time!' : 'Game Over!'}
            </h2>
            {(() => {
              const { winners, sortedPlayers } = getGameResults();
              return (
                <>
                  {winners.length > 1 ? (
                    <p className="mb-4 text-center text-lg">
                      It's a tie between {winners.map(w => w.name).join(' and ')}!
                    </p>
                  ) : (
                    <p className="mb-4 text-center text-lg">
                      {isOlympics ? '🏅' : '🎉'} {winners[0].name} wins {isOlympics ? 'the gold!' : '!'}
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
                          <span className="text-2xl w-8 text-center">
                            {isOlympics && medal ? medal : (
                              winners.includes(player) ? <Trophy className="text-yellow-500 inline w-6 h-6" /> : null
                            )}
                          </span>
                          <span className="font-medium flex-1">{player.name}</span>
                          <span className="text-gray-600">{player.score} pairs</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            <button
              onClick={onGameEnd}
              className={`w-full py-3 text-white rounded-lg font-semibold ${
                isOlympics
                  ? 'bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 hover:opacity-90'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isOlympics ? 'New Event' : 'Play Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
