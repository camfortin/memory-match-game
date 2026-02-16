import SwiftUI

struct ContentView: View {
    @Environment(GameState.self) private var gameState

    var body: some View {
        ZStack {
            // Theme-aware background
            backgroundGradient
                .ignoresSafeArea()

            if gameState.gameStarted {
                GameBoardView()
            } else {
                PlayerSetupView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: gameState.gameStarted)
    }

    private var backgroundGradient: some View {
        Group {
            if gameState.selectedTheme.isOlympics {
                LinearGradient(
                    colors: [
                        Color(red: 0.93, green: 0.95, blue: 1.0),
                        .white,
                        Color(red: 1.0, green: 0.93, blue: 0.93)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            } else {
                LinearGradient(
                    colors: [
                        Color(red: 0.93, green: 0.87, blue: 1.0),
                        Color(red: 1.0, green: 0.9, blue: 0.95)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
    }
}
