import SwiftUI

struct PlayerSetupView: View {
    @Environment(GameState.self) private var gameState

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                mainCard
                    .padding(.horizontal, 12)
                    .padding(.vertical, 16)

                footer
                    .padding(.bottom, 16)
            }
        }
        .scrollDismissesKeyboard(.interactively)
    }

    // MARK: - Main Card

    private var mainCard: some View {
        VStack(spacing: 20) {
            header
            playersSection
            startButton
            themeSection
            pairsSliderSection
            CommunityStatsView()
        }
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.1), radius: 12, y: 4)
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 4) {
            // Olympic rings
            HStack(spacing: 4) {
                Circle().fill(.blue).frame(width: 14, height: 14)
                Circle().fill(.yellow).frame(width: 14, height: 14)
                Circle().fill(Color(white: 0.2)).frame(width: 14, height: 14)
                Circle().fill(.green).frame(width: 14, height: 14)
                Circle().fill(.red).frame(width: 14, height: 14)
            }

            Text("Memory Match Games")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(gameState.selectedTheme.titleGradient)

            if gameState.selectedTheme.isOlympics {
                Text("GO FOR GOLD!")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
                    .tracking(2)
            }
        }
    }

    // MARK: - Players Section

    private var playersSection: some View {
        @Bindable var state = gameState

        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Competitors")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(gameState.selectedTheme.accentColor)
                Spacer()
                Text("\(gameState.players.count)/5 players")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }

            // Player list
            ForEach(Array(gameState.players.enumerated()), id: \.element.id) { index, player in
                playerRow(index: index, player: player)
            }

            // Add player button
            if gameState.players.count < 5 {
                Button {
                    withAnimation { gameState.addPlayer() }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 14))
                        Text("Add Player")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .foregroundStyle(gameState.selectedTheme.accentColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .strokeBorder(
                                gameState.selectedTheme.accentColor.opacity(0.4),
                                style: StrokeStyle(lineWidth: 2, dash: [6, 4])
                            )
                    )
                }
            }
        }
    }

    private func playerRow(index: Int, player: Player) -> some View {
        HStack(spacing: 8) {
            // Move up/down buttons
            VStack(spacing: 0) {
                Button {
                    guard index > 0 else { return }
                    withAnimation(.easeInOut(duration: 0.2)) {
                        gameState.movePlayer(from: IndexSet(integer: index), to: index - 1)
                    }
                } label: {
                    Image(systemName: "chevron.up")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(index > 0 ? .secondary : .quaternary)
                        .frame(width: 28, height: 20)
                }
                .disabled(index == 0)

                Button {
                    guard index < gameState.players.count - 1 else { return }
                    withAnimation(.easeInOut(duration: 0.2)) {
                        gameState.movePlayer(from: IndexSet(integer: index), to: index + 2)
                    }
                } label: {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(index < gameState.players.count - 1 ? .secondary : .quaternary)
                        .frame(width: 28, height: 20)
                }
                .disabled(index >= gameState.players.count - 1)
            }

            // Player number badge
            let colors = gameState.selectedTheme.playerColor(at: index)
            Text("\(index + 1)")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(colors.text)
                .frame(width: 30, height: 30)
                .background(colors.bg)
                .clipShape(Circle())

            // Name field
            TextField("Player \(index + 1) name", text: Binding(
                get: { gameState.players[index].name },
                set: { gameState.updatePlayerName(at: index, to: $0) }
            ))
            .textFieldStyle(.plain)
            .foregroundStyle(.primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(
                        gameState.selectedTheme.isOlympics
                            ? Color.blue.opacity(0.3)
                            : Color.purple.opacity(0.3),
                        lineWidth: 1
                    )
            )

            // Remove button
            if gameState.players.count > 2 {
                Button {
                    withAnimation { gameState.removePlayer(at: index) }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                        .frame(width: 36, height: 40)
                }
            }
        }
        .padding(6)
        .background(Color(white: 0.96))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Start Button

    private var startButton: some View {
        VStack(spacing: 6) {
            Button {
                gameState.startGame()
            } label: {
                Text(gameState.selectedTheme.isOlympics ? "Let the Games Begin!" : "Let's Play!")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        gameState.hasEmptyNames
                            ? AnyShapeStyle(Color.gray)
                            : AnyShapeStyle(gameState.selectedTheme.gradient)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .disabled(gameState.hasEmptyNames)
            .opacity(gameState.hasEmptyNames ? 0.5 : 1.0)

            if gameState.hasEmptyNames {
                Text("All players need a name to compete")
                    .font(.system(size: 13))
                    .foregroundStyle(.red.opacity(0.6))
            }
        }
    }

    // MARK: - Theme Picker

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Theme")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(
                    gameState.selectedTheme.isOlympics
                        ? Color(red: 0.15, green: 0.3, blue: 0.6)
                        : Color(red: 0.4, green: 0.15, blue: 0.6)
                )

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                ForEach(CardTheme.allCases) { theme in
                    themeButton(theme)
                }
            }
        }
        .padding(12)
        .background(gameState.selectedTheme.lightBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func themeButton(_ theme: CardTheme) -> some View {
        Button {
            withAnimation(.easeInOut(duration: 0.2)) {
                gameState.selectedTheme = theme
            }
        } label: {
            HStack(spacing: 4) {
                Text(theme.icon)
                    .font(.system(size: 20))
                Text(theme.displayName)
                    .font(.system(size: 12))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(
                gameState.selectedTheme == theme
                    ? AnyShapeStyle(gameState.selectedTheme.accentColor)
                    : AnyShapeStyle(Color.white)
            )
            .foregroundStyle(
                gameState.selectedTheme == theme ? .white : .primary
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    // MARK: - Card Pairs Slider

    private var pairsSliderSection: some View {
        @Bindable var state = gameState
        let totalCards = gameState.numPairs * 2

        return VStack(alignment: .leading, spacing: 8) {
            Text("Card Pairs: \(gameState.numPairs)")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(
                    gameState.selectedTheme.isOlympics
                        ? Color(red: 0.15, green: 0.3, blue: 0.6)
                        : Color(red: 0.4, green: 0.15, blue: 0.6)
                )

            Slider(
                value: Binding(
                    get: { Double(gameState.numPairs) },
                    set: { gameState.numPairs = Int($0) }
                ),
                in: 2...10,
                step: 1
            )
            .tint(gameState.selectedTheme.accentColor)

            HStack {
                Text("2")
                Spacer()
                Text("10")
            }
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(gameState.selectedTheme.accentColor.opacity(0.8))

            // Card preview grid
            let columns = Array(repeating: GridItem(.fixed(28), spacing: 4), count: min(totalCards, 10))
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(0..<totalCards, id: \.self) { _ in
                    Text(gameState.selectedTheme.emojis[0])
                        .font(.system(size: 14))
                        .frame(width: 28, height: 28)
                        .background(.white.opacity(0.5))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .padding(12)
        .background(gameState.selectedTheme.lightBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    // MARK: - Footer

    private var footer: some View {
        VStack(spacing: 4) {
            Text("Built by producthacker.ai")
                .font(.system(size: 13))
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Community Stats View

struct CommunityStatsView: View {
    @Environment(GameState.self) private var gameState
    @State private var stats: CommunityStats?
    @State private var loaded = false

    var body: some View {
        Group {
            if let stats, stats.totalGames > 0 {
                statsContent(stats)
            }
        }
        .task {
            guard !loaded else { return }
            stats = await SupabaseService.shared.fetchStats()
            loaded = true
        }
    }

    private func statsContent(_ stats: CommunityStats) -> some View {
        let isOlympics = gameState.selectedTheme.isOlympics
        let accentColor: Color = isOlympics ? .blue : Color(red: 0.58, green: 0.27, blue: 0.83)
        let barColor: Color = isOlympics
            ? Color(red: 0.39, green: 0.63, blue: 1.0)
            : Color(red: 0.7, green: 0.5, blue: 0.9)

        return VStack(alignment: .leading, spacing: 10) {
            Text("Community Stats")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(
                    isOlympics
                        ? Color(red: 0.15, green: 0.3, blue: 0.6)
                        : Color(red: 0.4, green: 0.15, blue: 0.6)
                )

            Text("\(stats.totalGames) game\(stats.totalGames != 1 ? "s" : "") played")
                .font(.system(size: 13))
                .foregroundStyle(.secondary)

            if !stats.themeCounts.isEmpty {
                Text("Popular Themes")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(accentColor)

                let maxCount = stats.themeCounts.first?.count ?? 1
                ForEach(stats.themeCounts) { item in
                    let theme = CardTheme(rawValue: item.theme)
                    HStack(spacing: 6) {
                        Text(theme?.icon ?? "?")
                            .frame(width: 20)
                        Text(theme?.displayName ?? item.theme)
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                            .frame(width: 60, alignment: .leading)
                            .lineLimit(1)

                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barColor)
                                .frame(width: geo.size.width * CGFloat(item.count) / CGFloat(maxCount))
                        }
                        .frame(height: 16)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                        Text("\(item.count)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .frame(width: 28, alignment: .trailing)
                    }
                    .frame(height: 20)
                }
            }

            if !stats.pairsCounts.isEmpty {
                Text("Popular Card Counts")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(accentColor)
                    .padding(.top, 4)

                let maxCount = stats.pairsCounts.first?.count ?? 1
                ForEach(stats.pairsCounts) { item in
                    HStack(spacing: 6) {
                        Text("\(item.numPairs)")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                            .frame(width: 20)
                        Text("\(item.numPairs * 2) cards")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                            .frame(width: 60, alignment: .leading)
                            .lineLimit(1)

                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barColor)
                                .frame(width: geo.size.width * CGFloat(item.count) / CGFloat(maxCount))
                        }
                        .frame(height: 16)
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 4))

                        Text("\(item.count)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .frame(width: 28, alignment: .trailing)
                    }
                    .frame(height: 20)
                }
            }
        }
        .padding(12)
        .background(gameState.selectedTheme.lightBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
