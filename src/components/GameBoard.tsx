import React, { useState, useEffect, useCallback } from 'react';
import { Player } from '../types';
import { Trophy, RotateCcw } from 'lucide-react';
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
    
    // Add a small delay before showing the cards
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

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showTurnMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {players[currentPlayer].name}'s turn!
        </div>
      )}
      
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-600">
          {players[currentPlayer].name}'s turn
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onGameEnd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
          <div className="flex gap-4">
            {players.map((player, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg ${
                  currentPlayer === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {player.name}: {player.score}
              </div>
            ))}
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

      <div className="grid grid-cols-3 gap-4">
        {players.map((player, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">{player.name}'s Pairs</h3>
            <div className="flex flex-wrap gap-2">
              {player.pairs.map((emoji, pairIndex) => (
                <div
                  key={pairIndex}
                  className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg text-4xl"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            {(() => {
              const { winners, sortedPlayers } = getGameResults();
              return (
                <>
                  {winners.length > 1 ? (
                    <p className="mb-4">It's a tie between {winners.map(w => w.name).join(' and ')}!</p>
                  ) : (
                    <p className="mb-4">🎉 {winners[0].name} wins!</p>
                  )}
                  <div className="space-y-2 mb-4">
                    {sortedPlayers.map((player, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {winners.includes(player) && <Trophy className="text-yellow-500" />}
                        <span>{player.name}: {player.score} pairs</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <button
              onClick={onGameEnd}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;