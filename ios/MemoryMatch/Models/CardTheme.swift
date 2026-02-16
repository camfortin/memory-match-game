import SwiftUI

enum CardTheme: String, CaseIterable, Identifiable {
    case olympics
    case fantasy
    case vehicles
    case thanksgiving
    case sports
    case easter

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .olympics: "Winter"
        case .fantasy: "Fantasy"
        case .vehicles: "Vehicles"
        case .thanksgiving: "Holiday"
        case .sports: "Sports"
        case .easter: "Easter"
        }
    }

    var icon: String {
        switch self {
        case .olympics: "❄️"
        case .fantasy: "🏰"
        case .vehicles: "🚗"
        case .thanksgiving: "🦃"
        case .sports: "⚽"
        case .easter: "🐰"
        }
    }

    var emojis: [String] {
        switch self {
        case .olympics:
            ["⛷️", "🏂", "⛸️", "🎿", "🛷", "🏒", "🥌", "❄️", "🏔️", "🥇"]
        case .fantasy:
            ["🦄", "👸", "🏰", "🐉", "🧚", "🧙‍♂️", "🗡️", "👑", "🔮", "🧝‍♀️"]
        case .vehicles:
            ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚛"]
        case .thanksgiving:
            ["🦃", "🥧", "🌽", "🥔", "🥖", "🍗", "🍽️", "🍁", "🎃", "👨‍👩‍👧‍👦"]
        case .sports:
            ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎳", "🏓", "⛳"]
        case .easter:
            ["🐰", "🥚", "🐣", "🌷", "🦋", "🐑", "🌸", "🧺", "🐥", "🌈"]
        }
    }

    // Card back gradient colors (matched to Tailwind THEME_STYLES)
    var gradientColors: [Color] {
        switch self {
        case .olympics:
            // from-blue-600 via-yellow-400 to-red-500
            [Color(red: 0.145, green: 0.388, blue: 0.922),
             Color(red: 0.980, green: 0.800, blue: 0.082),
             Color(red: 0.937, green: 0.267, blue: 0.267)]
        case .fantasy:
            [Color(red: 0.58, green: 0.27, blue: 0.83), .pink]
        case .vehicles:
            [Color(red: 0.235, green: 0.478, blue: 0.859), .cyan]
        case .thanksgiving:
            [.orange, Color(red: 0.96, green: 0.76, blue: 0.19)]
        case .sports:
            [Color(red: 0.133, green: 0.545, blue: 0.133), Color(red: 0.2, green: 0.78, blue: 0.35)]
        case .easter:
            [Color(red: 0.95, green: 0.55, blue: 0.66),
             Color(red: 0.98, green: 0.80, blue: 0.08),
             Color(red: 0.29, green: 0.73, blue: 0.29)]
        }
    }

    var gradient: LinearGradient {
        LinearGradient(
            colors: gradientColors,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Title gradient: only 2 variants (matches web app exactly)
    // Olympics: from-blue-600 via-yellow-500 to-red-500
    // Others: from-purple-600 to-pink-600
    var titleGradient: LinearGradient {
        if isOlympics {
            return LinearGradient(
                colors: [
                    Color(red: 0.145, green: 0.388, blue: 0.922),
                    Color(red: 0.918, green: 0.702, blue: 0.031),
                    Color(red: 0.937, green: 0.267, blue: 0.267)
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
        }
        return LinearGradient(
            colors: [
                Color(red: 0.576, green: 0.2, blue: 0.918),
                Color(red: 0.859, green: 0.153, blue: 0.467)
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    var isOlympics: Bool { self == .olympics }

    // Theme-aware accent color for UI elements
    var accentColor: Color {
        isOlympics ? .blue : Color(red: 0.58, green: 0.27, blue: 0.83)
    }

    var lightBackground: Color {
        isOlympics
            ? Color(red: 0.93, green: 0.95, blue: 1.0)
            : Color(red: 0.95, green: 0.92, blue: 1.0)
    }

    // Olympic ring colors for player badges
    static let olympicPlayerColors: [(bg: Color, text: Color, light: Color)] = [
        (bg: .blue, text: .white, light: Color(red: 0.87, green: 0.92, blue: 1.0)),
        (bg: Color(red: 0.98, green: 0.84, blue: 0.01), text: Color(red: 0.1, green: 0.1, blue: 0.1), light: Color(red: 1.0, green: 0.97, blue: 0.88)),
        (bg: Color(red: 0.2, green: 0.2, blue: 0.2), text: .white, light: Color(red: 0.9, green: 0.9, blue: 0.9)),
        (bg: .green, text: .white, light: Color(red: 0.87, green: 1.0, blue: 0.88)),
        (bg: .red, text: .white, light: Color(red: 1.0, green: 0.88, blue: 0.88)),
    ]

    func playerColor(at index: Int) -> (bg: Color, text: Color, light: Color) {
        if isOlympics {
            return Self.olympicPlayerColors[index % Self.olympicPlayerColors.count]
        }
        return (
            bg: Color(red: 0.58, green: 0.27, blue: 0.83),
            text: .white,
            light: Color(red: 0.93, green: 0.87, blue: 1.0)
        )
    }
}
