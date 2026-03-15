import GameKit

@Observable
final class GameCenterManager: NSObject {
    static let shared = GameCenterManager()

    var isAuthenticated = false
    var localPlayerName: String?

    // MARK: - Leaderboard IDs (configure in App Store Connect)
    private enum Leaderboard {
        static let soloFewestTurns = "com.memorymatch.solo.fewestturns"
        static let vsComputerWins = "com.memorymatch.vscomputer.wins"
    }

    // MARK: - Achievement IDs (configure in App Store Connect)
    private enum Achievement {
        static let firstGame = "com.memorymatch.first.game"
        static let perfectMemory = "com.memorymatch.perfect.memory"
        static let beatHardComputer = "com.memorymatch.beat.hard"
        static let tenGames = "com.memorymatch.ten.games"
    }

    private var totalGamesPlayed: Int {
        get { UserDefaults.standard.integer(forKey: "gc_total_games") }
        set { UserDefaults.standard.set(newValue, forKey: "gc_total_games") }
    }

    private var vsComputerWins: Int {
        get { UserDefaults.standard.integer(forKey: "gc_vs_computer_wins") }
        set { UserDefaults.standard.set(newValue, forKey: "gc_vs_computer_wins") }
    }

    // MARK: - Authentication

    func authenticate() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
            if let vc = viewController {
                // Present the Game Center login UI
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let rootVC = windowScene.windows.first?.rootViewController {
                    rootVC.present(vc, animated: true)
                }
                return
            }

            if let error {
                print("Game Center auth failed: \(error.localizedDescription)")
                return
            }

            guard GKLocalPlayer.local.isAuthenticated else { return }

            self?.isAuthenticated = true
            self?.localPlayerName = GKLocalPlayer.local.displayName
        }
    }

    // MARK: - Report Game Completion

    func reportGameCompletion(
        gameMode: GameMode,
        soloTurns: Int,
        numPairs: Int,
        playerScore: Int,
        computerScore: Int?,
        difficulty: ComputerDifficulty
    ) {
        guard isAuthenticated else { return }

        totalGamesPlayed += 1

        // Report first game achievement
        reportAchievement(Achievement.firstGame, percentComplete: 100)

        // Report 10 games achievement
        let tenProgress = min(Double(totalGamesPlayed) / 10.0 * 100.0, 100.0)
        reportAchievement(Achievement.tenGames, percentComplete: tenProgress)

        switch gameMode {
        case .solo:
            // Submit fewest turns score (lower is better — Game Center sorts ascending)
            submitScore(soloTurns, to: Leaderboard.soloFewestTurns)

            // Perfect memory: completed in exactly numPairs turns
            if soloTurns <= numPairs {
                reportAchievement(Achievement.perfectMemory, percentComplete: 100)
            }

        case .vsComputer:
            if let computerScore, playerScore > computerScore {
                vsComputerWins += 1
                submitScore(vsComputerWins, to: Leaderboard.vsComputerWins)

                if difficulty == .hard {
                    reportAchievement(Achievement.beatHardComputer, percentComplete: 100)
                }
            }

        case .multiplayer:
            break
        }
    }

    // MARK: - Game Center UI

    func showLeaderboard(from viewController: UIViewController? = nil) {
        guard isAuthenticated else { return }

        let gcVC = GKGameCenterViewController(state: .leaderboards)
        gcVC.gameCenterDelegate = self
        present(gcVC)
    }

    func showAchievements(from viewController: UIViewController? = nil) {
        guard isAuthenticated else { return }

        let gcVC = GKGameCenterViewController(state: .achievements)
        gcVC.gameCenterDelegate = self
        present(gcVC)
    }

    // MARK: - Private Helpers

    private func submitScore(_ score: Int, to leaderboardID: String) {
        Task {
            do {
                try await GKLeaderboard.submitScore(
                    score,
                    context: 0,
                    player: GKLocalPlayer.local,
                    leaderboardIDs: [leaderboardID]
                )
            } catch {
                print("Game Center score submit failed: \(error.localizedDescription)")
            }
        }
    }

    private func reportAchievement(_ id: String, percentComplete: Double) {
        Task {
            let achievement = GKAchievement(identifier: id)
            achievement.percentComplete = percentComplete
            achievement.showsCompletionBanner = true
            do {
                try await GKAchievement.report([achievement])
            } catch {
                print("Game Center achievement report failed: \(error.localizedDescription)")
            }
        }
    }

    private func present(_ viewController: UIViewController) {
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(viewController, animated: true)
        }
    }
}

// MARK: - GKGameCenterControllerDelegate

extension GameCenterManager: GKGameCenterControllerDelegate {
    func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
