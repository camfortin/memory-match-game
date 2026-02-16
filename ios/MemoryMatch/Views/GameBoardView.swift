import SwiftUI

struct GameBoardView: View {
    @Environment(GameState.self) private var gameState
    @Environment(\.horizontalSizeClass) private var sizeClass

    var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 16) {
                    headerSection
                    cardGrid
                    pairsSection
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 16)
            }

            // Turn notification overlay
            if gameState.showTurnMessage {
                turnMessageOverlay
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Game over modal
            if gameState.gameOver {
                GameOverView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: gameState.showTurnMessage)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 10) {
            HStack {
                Text("\(gameState.players[gameState.currentPlayer].name)'s turn")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(gameState.selectedTheme.accentColor)
                    .lineLimit(1)

                Spacer()

                Button {
                    gameState.endGame()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 13))
                        Text("Reset")
                            .font(.system(size: 13))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(white: 0.94))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .foregroundStyle(.primary)
            }

            // Score pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(Array(gameState.players.enumerated()), id: \.element.id) { index, player in
                        scorePill(player: player, index: index)
                    }
                }
            }
        }
    }

    private func scorePill(player: Player, index: Int) -> some View {
        let colors = gameState.selectedTheme.playerColor(at: index)
        let isCurrent = gameState.currentPlayer == index

        return Text("\(player.name): \(player.score)")
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(isCurrent ? colors.text : Color(white: 0.25))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isCurrent ? colors.bg : colors.light)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Card Grid

    private var cardGrid: some View {
        let columns = sizeClass == .regular
            ? Array(repeating: GridItem(.flexible(), spacing: 8), count: 5)
            : Array(repeating: GridItem(.flexible(), spacing: 6), count: 4)

        return LazyVGrid(columns: columns, spacing: sizeClass == .regular ? 8 : 6) {
            ForEach(gameState.cards) { card in
                CardView(card: card, theme: gameState.selectedTheme) {
                    gameState.handleCardTap(card)
                }
            }
        }
    }

    // MARK: - Player Pairs

    private var pairsSection: some View {
        let columns = sizeClass == .regular
            ? Array(repeating: GridItem(.flexible(), spacing: 8), count: min(gameState.players.count, 5))
            : Array(repeating: GridItem(.flexible(), spacing: 6), count: 2)

        return LazyVGrid(columns: columns, spacing: sizeClass == .regular ? 8 : 6) {
            ForEach(Array(gameState.players.enumerated()), id: \.element.id) { index, player in
                playerPairsCard(player: player, index: index)
            }
        }
    }

    private func playerPairsCard(player: Player, index: Int) -> some View {
        let colors = gameState.selectedTheme.playerColor(at: index)

        return VStack(alignment: .leading, spacing: 6) {
            Text("\(player.name)'s Pairs")
                .font(.system(size: 13, weight: .semibold))
                .lineLimit(1)

            let pairColumns = Array(repeating: GridItem(.fixed(36), spacing: 4), count: 4)
            LazyVGrid(columns: pairColumns, spacing: 4) {
                ForEach(Array(player.pairs.enumerated()), id: \.offset) { _, emoji in
                    Text(emoji)
                        .font(.system(size: 22))
                        .frame(width: 36, height: 36)
                        .background(colors.light)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
    }

    // MARK: - Turn Message

    private var turnMessageOverlay: some View {
        VStack {
            let colors = gameState.selectedTheme.playerColor(at: gameState.currentPlayer)
            Text("\(gameState.players[gameState.currentPlayer].name)'s turn!")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(colors.text)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(colors.bg)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .shadow(color: .black.opacity(0.2), radius: 8, y: 4)
                .padding(.top, 8)

            Spacer()
        }
    }
}
