import SwiftUI

struct GameOverView: View {
    @Environment(GameState.self) private var gameState

    private let medalEmojis = ["🥇", "🥈", "🥉"]

    var body: some View {
        ZStack {
            // Dimmed backdrop
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {} // Absorb taps

            modalContent
                .padding(16)
                .transition(.scale.combined(with: .opacity))
        }
    }

    private var modalContent: some View {
        let sorted = gameState.sortedPlayers
        let winners = gameState.winners
        let isOlympics = gameState.selectedTheme.isOlympics

        return VStack(spacing: 16) {
            // Olympic rings header
            if isOlympics {
                HStack(spacing: 4) {
                    Circle().fill(.blue).frame(width: 10, height: 10)
                    Circle().fill(.yellow).frame(width: 10, height: 10)
                    Circle().fill(Color(white: 0.2)).frame(width: 10, height: 10)
                    Circle().fill(.green).frame(width: 10, height: 10)
                    Circle().fill(.red).frame(width: 10, height: 10)
                }
            }

            // Title
            Text(isOlympics ? "Ceremony Time!" : "Game Over!")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(isOlympics ? Color(red: 0.15, green: 0.3, blue: 0.6) : .primary)

            // Winner announcement
            if winners.count > 1 {
                Text("It's a tie between \(winners.map(\.name).joined(separator: " and "))!")
                    .font(.system(size: 16))
                    .multilineTextAlignment(.center)
            } else if let winner = winners.first {
                HStack(spacing: 4) {
                    Text(isOlympics ? "🏅" : "🎉")
                    Text("\(winner.name) wins\(isOlympics ? " the gold!" : "!")")
                        .font(.system(size: 16))
                }
            }

            // Player results
            VStack(spacing: 6) {
                ForEach(Array(sorted.enumerated()), id: \.element.id) { index, player in
                    let medalIdx = gameState.medalIndex(for: index, in: sorted)
                    let isWinner = winners.contains(where: { $0.id == player.id })

                    HStack(spacing: 10) {
                        // Medal or trophy
                        Group {
                            if isOlympics, let medalIdx, medalIdx < 3 {
                                Text(medalEmojis[medalIdx])
                                    .font(.system(size: 20))
                            } else if isWinner {
                                Image(systemName: "trophy.fill")
                                    .foregroundStyle(.yellow)
                                    .font(.system(size: 16))
                            } else {
                                Text(" ")
                                    .font(.system(size: 20))
                            }
                        }
                        .frame(width: 28)

                        Text(player.name)
                            .font(.system(size: 15, weight: .medium))
                            .lineLimit(1)

                        Spacer()

                        Text("\(player.score) pairs")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                    }
                    .padding(8)
                    .background(
                        index == 0 && isOlympics
                            ? Color(red: 1.0, green: 0.98, blue: 0.9)
                            : Color.clear
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }

            // Play Again button
            Button {
                gameState.endGame()
            } label: {
                Text(isOlympics ? "New Event" : "Play Again")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        isOlympics
                            ? AnyShapeStyle(gameState.selectedTheme.gradient)
                            : AnyShapeStyle(Color(red: 0.58, green: 0.27, blue: 0.83))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(20)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(
                    isOlympics ? .yellow.opacity(0.5) : .clear,
                    lineWidth: isOlympics ? 3 : 0
                )
        )
        .shadow(color: .black.opacity(0.25), radius: 20, y: 8)
        .frame(maxWidth: 400)
    }
}
