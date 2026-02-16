import SwiftUI

struct Card: Identifiable {
    let id = UUID()
    let imageIndex: Int
    var isFlipped: Bool = false
    var isMatched: Bool = false
}

@Observable
final class GameState {
    // MARK: - Setup state
    var gameStarted = false
    var players: [Player] = []
    var numPairs: Int = 5
    var selectedTheme: CardTheme = .olympics

    // MARK: - Game state
    var cards: [Card] = []
    var currentPlayer: Int = 0
    var flippedCards: [Card] = []
    var matchesThisTurn: Int = 0
    var gameOver = false
    var showTurnMessage = false
    var isProcessing = false

    // MARK: - Timing
    private var gameStartTime: Date?

    // MARK: - Player name persistence
    private static let playerNamesKey = "memory_match_player_names"
    private static let defaultNames = ["Willa", "Lark"]

    init() {
        let savedNames = Self.loadSavedNames()
        players = savedNames.map { Player(name: $0) }
    }

    // MARK: - Name persistence

    private static func loadSavedNames() -> [String] {
        if let data = UserDefaults.standard.data(forKey: playerNamesKey),
           let names = try? JSONDecoder().decode([String].self, from: data),
           !names.isEmpty {
            return names
        }
        return defaultNames
    }

    func savePlayerNames() {
        let names = players.map(\.name)
        if let data = try? JSONEncoder().encode(names) {
            UserDefaults.standard.set(data, forKey: Self.playerNamesKey)
        }
    }

    // MARK: - Player management

    func addPlayer() {
        guard players.count < 5 else { return }
        players.append(Player(name: ""))
    }

    func removePlayer(at index: Int) {
        guard players.count > 2 else { return }
        players.remove(at: index)
        savePlayerNames()
    }

    func updatePlayerName(at index: Int, to name: String) {
        guard index < players.count else { return }
        players[index].name = name
        savePlayerNames()
    }

    func movePlayer(from source: IndexSet, to destination: Int) {
        players.move(fromOffsets: source, toOffset: destination)
        savePlayerNames()
    }

    var hasEmptyNames: Bool {
        players.contains { $0.name.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    // MARK: - Game lifecycle

    func startGame() {
        // Reset scores
        for i in players.indices {
            players[i].score = 0
            players[i].pairs = []
        }

        // Create and shuffle cards
        var newCards: [Card] = []
        for i in 0..<numPairs {
            newCards.append(Card(imageIndex: i))
            newCards.append(Card(imageIndex: i))
        }
        cards = newCards.shuffled()

        currentPlayer = 0
        flippedCards = []
        matchesThisTurn = 0
        gameOver = false
        showTurnMessage = false
        isProcessing = false
        gameStartTime = Date()
        gameStarted = true
    }

    func endGame() {
        gameStarted = false
        for i in players.indices {
            players[i].score = 0
            players[i].pairs = []
        }
    }

    // MARK: - Card interaction

    func handleCardTap(_ card: Card) {
        guard !isProcessing,
              !card.isFlipped,
              !card.isMatched,
              flippedCards.count < 2 else { return }

        // Flip the card
        if let idx = cards.firstIndex(where: { $0.id == card.id }) {
            cards[idx].isFlipped = true
            flippedCards.append(cards[idx])
        }

        // Check for match when two cards flipped
        if flippedCards.count == 2 {
            isProcessing = true
            let first = flippedCards[0]
            let second = flippedCards[1]
            let isMatch = first.imageIndex == second.imageIndex

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                guard let self else { return }

                withAnimation(.easeInOut(duration: 0.3)) {
                    for i in self.cards.indices {
                        if self.cards[i].id == first.id || self.cards[i].id == second.id {
                            self.cards[i].isFlipped = false
                            if isMatch {
                                self.cards[i].isMatched = true
                            }
                        }
                    }
                }

                self.flippedCards = []

                if isMatch {
                    // Award point and record pair
                    self.players[self.currentPlayer].score += 1
                    self.players[self.currentPlayer].pairs.append(
                        self.selectedTheme.emojis[first.imageIndex]
                    )

                    self.matchesThisTurn += 1

                    // Rotate after 3 consecutive matches
                    if self.matchesThisTurn >= 3 {
                        self.rotateTurn()
                    }

                    // Check for game completion
                    if self.cards.allSatisfy(\.isMatched) {
                        self.gameOver = true
                        self.logGameCompletion()
                    }
                } else {
                    // Mismatch: rotate turn
                    self.rotateTurn()
                }

                self.isProcessing = false
            }
        }
    }

    private func rotateTurn() {
        currentPlayer = (currentPlayer + 1) % players.count
        matchesThisTurn = 0
        showTurnMessage = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.showTurnMessage = false
        }
    }

    // MARK: - Game results

    var sortedPlayers: [Player] {
        players.sorted { $0.score > $1.score }
    }

    var winners: [Player] {
        let highScore = sortedPlayers.first?.score ?? 0
        return players.filter { $0.score == highScore }
    }

    func medalIndex(for playerIndex: Int, in sorted: [Player]) -> Int? {
        guard playerIndex < sorted.count else { return nil }
        if playerIndex == 0 { return 0 }

        let prevScore = sorted[playerIndex - 1].score
        let currScore = sorted[playerIndex].score

        if currScore == prevScore {
            return medalIndex(for: playerIndex - 1, in: sorted)
        }
        return min(playerIndex, 2)
    }

    // MARK: - Supabase logging

    private func logGameCompletion() {
        guard let startTime = gameStartTime else { return }
        let duration = Int(Date().timeIntervalSince(startTime))
        let winnerNames = winners.map(\.name)

        Task {
            await SupabaseService.shared.logGame(
                playerNames: players.map(\.name),
                playerScores: players.map(\.score),
                winnerNames: winnerNames,
                theme: selectedTheme.rawValue,
                numPairs: numPairs,
                numPlayers: players.count,
                durationSeconds: duration
            )
        }
    }
}
