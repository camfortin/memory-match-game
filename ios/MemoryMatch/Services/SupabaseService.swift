import Foundation
#if canImport(Supabase)
import Supabase
#endif

struct ThemeCount: Identifiable {
    let id = UUID()
    let theme: String
    let count: Int
}

struct PairsCount: Identifiable {
    let id = UUID()
    let numPairs: Int
    let count: Int
}

struct CommunityStats {
    let totalGames: Int
    let themeCounts: [ThemeCount]
    let pairsCounts: [PairsCount]
}

final class SupabaseService {
    static let shared = SupabaseService()

    #if canImport(Supabase)
    private let client: SupabaseClient?
    #endif

    private init() {
        #if canImport(Supabase)
        guard let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              urlString != "YOUR_SUPABASE_URL",
              let url = URL(string: urlString),
              let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
              key != "YOUR_SUPABASE_ANON_KEY" else {
            client = nil
            return
        }
        client = SupabaseClient(supabaseURL: url, supabaseKey: key)
        #endif
    }

    var isAvailable: Bool {
        #if canImport(Supabase)
        return client != nil
        #else
        return false
        #endif
    }

    // MARK: - Game Logging

    func logGame(
        playerNames: [String],
        playerScores: [Int],
        winnerNames: [String],
        theme: String,
        numPairs: Int,
        numPlayers: Int,
        durationSeconds: Int
    ) async {
        #if canImport(Supabase)
        guard let client else { return }

        struct GameLog: Encodable {
            let player_names: [String]
            let player_scores: [Int]
            let winner_names: [String]
            let theme: String
            let num_pairs: Int
            let num_players: Int
            let duration_seconds: Int
        }

        let log = GameLog(
            player_names: playerNames,
            player_scores: playerScores,
            winner_names: winnerNames,
            theme: theme,
            num_pairs: numPairs,
            num_players: numPlayers,
            duration_seconds: durationSeconds
        )

        do {
            try await client.from("mem_game_logs").insert(log).execute()
        } catch {
            // Silent failure — matches web app behavior
        }
        #endif
    }

    // MARK: - Community Stats

    func fetchStats() async -> CommunityStats? {
        #if canImport(Supabase)
        guard let client else { return nil }

        struct LogRow: Decodable {
            let theme: String
            let num_pairs: Int
        }

        do {
            // Get total count
            let countResponse = try await client
                .from("mem_game_logs")
                .select("*", head: true, count: .exact)
                .execute()

            let totalGames = countResponse.count ?? 0
            guard totalGames > 0 else { return nil }

            // Fetch theme and pairs data
            let logs: [LogRow] = try await client
                .from("mem_game_logs")
                .select("theme, num_pairs")
                .execute()
                .value

            // Aggregate theme counts
            var themeMap: [String: Int] = [:]
            var pairsMap: [Int: Int] = [:]
            for log in logs {
                themeMap[log.theme, default: 0] += 1
                pairsMap[log.num_pairs, default: 0] += 1
            }

            let themeCounts = themeMap
                .map { ThemeCount(theme: $0.key, count: $0.value) }
                .sorted { $0.count > $1.count }

            let pairsCounts = pairsMap
                .map { PairsCount(numPairs: $0.key, count: $0.value) }
                .sorted { $0.count > $1.count }

            return CommunityStats(
                totalGames: totalGames,
                themeCounts: themeCounts,
                pairsCounts: pairsCounts
            )
        } catch {
            return nil
        }
        #else
        return nil
        #endif
    }
}
