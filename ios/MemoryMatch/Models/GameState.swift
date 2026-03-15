import SwiftUI

struct Card: Identifiable {
    let id = UUID()
    let imageIndex: Int
    var isFlipped: Bool = false
    var isMatched: Bool = false
}

enum GameMode: String, CaseIterable {
    case multiplayer
    case vsComputer = "vs-computer"
    case solo
}

enum ComputerDifficulty: String, CaseIterable {
    case easy
    case medium
    case hard

    var label: String {
        switch self {
        case .easy: "Easy"
        case .medium: "Medium"
        case .hard: "Hard"
        }
    }

    var description: String {
        switch self {
        case .easy: "Forgetful"
        case .medium: "Sometimes remembers"
        case .hard: "Sharp memory"
        }
    }
}

@Observable
final class GameState {
    // MARK: - Setup state
    var gameStarted = false
    var players: [Player] = []
    var numPairs: Int = 5
    var selectedTheme: CardTheme = .olympics
    var gameMode: GameMode = .multiplayer
    var computerDifficulty: ComputerDifficulty = .medium

    // MARK: - Game state
    var cards: [Card] = []
    var currentPlayer: Int = 0
    var flippedCards: [Card] = []
    var matchesThisTurn: Int = 0
    var gameOver = false
    var showTurnMessage = false
    var isProcessing = false
    var soloTurns: Int = 0
    var isComputerThinking = false

    // MARK: - Computer AI
    private var computerMemory: [Int: [UUID]] = [:]  // imageIndex -> card IDs
    private var computerTurnInProgress = false

    // MARK: - Timing
    private var gameStartTime: Date?

    // MARK: - Saved multiplayer players (for mode switching)
    private var savedMultiplayerPlayers: [Player] = []

    // MARK: - Player name persistence
    private static let playerNamesKey = "memory_match_player_names"
    private static let defaultNames = ["Willa", "Lark"]

    init() {
        let savedNames = Self.loadSavedNames()
        players = savedNames.map { Player(name: $0) }
    }

    // MARK: - Computed properties

    var isSolo: Bool { gameMode == .solo }
    var isVsComputer: Bool { gameMode == .vsComputer }
    var isComputerTurn: Bool { isVsComputer && currentPlayer == 1 }

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
        let names = players.filter { $0.name != "Computer" }.map(\.name)
        if !names.isEmpty, let data = try? JSONEncoder().encode(names) {
            UserDefaults.standard.set(data, forKey: Self.playerNamesKey)
        }
    }

    // MARK: - Game mode switching

    func switchGameMode(to mode: GameMode) {
        guard mode != gameMode else { return }

        // Save current multiplayer players before switching away
        if gameMode == .multiplayer {
            savedMultiplayerPlayers = players
        }

        gameMode = mode

        let firstName = players.first?.name ?? Self.loadSavedNames().first ?? Self.defaultNames[0]

        switch mode {
        case .vsComputer:
            players = [
                Player(name: firstName),
                Player(name: "Computer")
            ]
        case .solo:
            players = [Player(name: firstName)]
        case .multiplayer:
            if !savedMultiplayerPlayers.isEmpty {
                players = savedMultiplayerPlayers
            } else {
                let savedNames = Self.loadSavedNames()
                players = savedNames.map { Player(name: $0) }
            }
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
        players.contains { $0.name != "Computer" && $0.name.trimmingCharacters(in: .whitespaces).isEmpty }
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
        soloTurns = 0
        isComputerThinking = false
        computerMemory = [:]
        computerTurnInProgress = false
        gameStartTime = Date()
        gameStarted = true

        // Trigger computer turn if computer goes first (shouldn't happen normally)
        if isComputerTurn {
            triggerComputerTurn()
        }
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

        // Block human clicks during computer's turn
        if isComputerThinking || isComputerTurn { return }

        // Flip the card
        if let idx = cards.firstIndex(where: { $0.id == card.id }) {
            cards[idx].isFlipped = true
            flippedCards.append(cards[idx])

            // Record to computer memory when human flips a card
            recordToMemory(cards[idx])
        }

        // Check for match when two cards flipped
        if flippedCards.count == 2 {
            resolveFlippedCards()
        }
    }

    // MARK: - Computer AI

    private func recordToMemory(_ card: Card) {
        guard isVsComputer else { return }

        var shouldRemember = false
        switch computerDifficulty {
        case .hard:
            shouldRemember = true
        case .medium:
            shouldRemember = Double.random(in: 0...1) < 0.5
        case .easy:
            shouldRemember = false
        }

        if shouldRemember {
            var existing = computerMemory[card.imageIndex] ?? []
            if !existing.contains(card.id) {
                existing.append(card.id)
                computerMemory[card.imageIndex] = existing
            }
        }
    }

    func triggerComputerTurn() {
        guard isVsComputer, currentPlayer == 1, !gameOver else { return }
        guard !computerTurnInProgress else { return }

        computerTurnInProgress = true
        isComputerThinking = true

        let availableCards = cards.filter { !$0.isMatched && !$0.isFlipped }
        guard availableCards.count >= 2 else {
            computerTurnInProgress = false
            isComputerThinking = false
            return
        }

        let (card1, card2) = pickComputerCards(from: availableCards)

        // Flip first card after thinking delay
        let thinkDelay = 0.6 + Double.random(in: 0...0.4)
        DispatchQueue.main.asyncAfter(deadline: .now() + thinkDelay) { [weak self] in
            guard let self, !self.gameOver else { return }

            if let idx = self.cards.firstIndex(where: { $0.id == card1.id }) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    self.cards[idx].isFlipped = true
                }
                self.recordToMemory(self.cards[idx])
            }

            // Flip second card after another delay
            let secondDelay = 0.7 + Double.random(in: 0...0.3)
            DispatchQueue.main.asyncAfter(deadline: .now() + secondDelay) { [weak self] in
                guard let self, !self.gameOver else { return }

                if let idx = self.cards.firstIndex(where: { $0.id == card2.id }) {
                    withAnimation(.easeInOut(duration: 0.5)) {
                        self.cards[idx].isFlipped = true
                    }
                    self.recordToMemory(self.cards[idx])
                }

                self.flippedCards = [card1, card2]
                self.isComputerThinking = false
                self.resolveFlippedCards()
            }
        }
    }

    private func pickComputerCards(from availableCards: [Card]) -> (Card, Card) {
        // Check memory for known pairs
        for (_, cardIds) in computerMemory {
            let available = cardIds.filter { id in
                cards.first(where: { $0.id == id && !$0.isMatched }) != nil
            }
            if available.count >= 2 {
                let card1 = cards.first(where: { $0.id == available[0] })!
                let card2 = cards.first(where: { $0.id == available[1] })!
                return (card1, card2)
            }
        }

        // No known pair - pick first card randomly
        let firstCard = availableCards.randomElement()!

        // After seeing first card, check if we know where its match is
        let knownForFirst = computerMemory[firstCard.imageIndex] ?? []
        if let matchId = knownForFirst.first(where: { $0 != firstCard.id }),
           let matchCard = cards.first(where: { $0.id == matchId && !$0.isMatched }) {
            return (firstCard, matchCard)
        }

        // Pick second card randomly (different from first)
        let remaining = availableCards.filter { $0.id != firstCard.id }
        let secondCard = remaining.randomElement()!
        return (firstCard, secondCard)
    }

    // MARK: - Match resolution

    private func resolveFlippedCards() {
        guard flippedCards.count == 2 else { return }

        isProcessing = true
        let first = flippedCards[0]
        let second = flippedCards[1]
        let isMatch = first.imageIndex == second.imageIndex

        // Count turn for solo mode
        if isSolo {
            soloTurns += 1
        }

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
                // Remove matched cards from computer memory
                self.computerMemory.removeValue(forKey: first.imageIndex)

                // Award point and record pair
                self.players[self.currentPlayer].score += 1
                self.players[self.currentPlayer].pairs.append(
                    self.selectedTheme.emojis[first.imageIndex]
                )

                if self.isSolo {
                    // Solo mode: no turn rotation
                } else {
                    self.matchesThisTurn += 1

                    // Rotate after 3 consecutive matches
                    if self.matchesThisTurn >= 3 {
                        self.rotateTurn()
                    }
                }

                // Check for game completion
                if self.cards.allSatisfy(\.isMatched) {
                    self.gameOver = true
                    self.logGameCompletion()
                }
            } else {
                if !self.isSolo {
                    // Mismatch: rotate turn
                    self.rotateTurn()
                }
            }

            self.isProcessing = false
            self.computerTurnInProgress = false

            // Trigger next computer turn if it's still computer's turn
            if self.isComputerTurn && !self.gameOver {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
                    self?.triggerComputerTurn()
                }
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

        // Trigger computer turn after rotation
        if isComputerTurn && !gameOver {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) { [weak self] in
                self?.triggerComputerTurn()
            }
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

        // Filter out "Computer" from logs — only log human players
        let humanPlayers = players.filter { $0.name != "Computer" }
        let winnerNames = winners.map(\.name).filter { $0 != "Computer" }

        Task {
            await SupabaseService.shared.logGame(
                playerNames: humanPlayers.map(\.name),
                playerScores: humanPlayers.map(\.score),
                winnerNames: winnerNames,
                theme: selectedTheme.rawValue,
                numPairs: numPairs,
                numPlayers: humanPlayers.count,
                durationSeconds: duration
            )
        }

        // Submit to Game Center
        GameCenterManager.shared.reportGameCompletion(
            gameMode: gameMode,
            soloTurns: soloTurns,
            numPairs: numPairs,
            playerScore: players.first?.score ?? 0,
            computerScore: isVsComputer ? (players.last?.score ?? 0) : nil,
            difficulty: computerDifficulty
        )
    }
}
