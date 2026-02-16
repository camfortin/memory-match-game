import SwiftUI

struct CardView: View {
    let card: Card
    let theme: CardTheme
    let onTap: () -> Void

    @State private var rotation: Double = 0

    var body: some View {
        cardContent
            .aspectRatio(1, contentMode: .fit)
            .opacity(card.isMatched ? 0 : 1)
            .animation(.easeOut(duration: 0.4), value: card.isMatched)
            .onTapGesture {
                if !card.isMatched { onTap() }
            }
            .onChange(of: card.isFlipped) { _, isFlipped in
                withAnimation(.easeInOut(duration: 0.5)) {
                    rotation = isFlipped ? 180 : 0
                }
            }
    }

    private var cardContent: some View {
        ZStack {
            // Back of card (visible when rotation < 90)
            cardBack
                .opacity(rotation < 90 ? 1 : 0)

            // Front of card (visible when rotation >= 90)
            cardFront
                .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                .opacity(rotation >= 90 ? 1 : 0)
        }
        .rotation3DEffect(.degrees(rotation), axis: (x: 0, y: 1, z: 0))
    }

    private var cardBack: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(theme.gradient)
            .overlay(
                Group {
                    if theme.isOlympics {
                        // Olympic rings on card back
                        VStack(spacing: -1) {
                            HStack(spacing: 2) {
                                Text("🔵").font(.system(size: 16))
                                Text("🟡").font(.system(size: 16))
                                Text("⚫").font(.system(size: 16))
                            }
                            HStack(spacing: 2) {
                                Text("🟢").font(.system(size: 16))
                                Text("🔴").font(.system(size: 16))
                            }
                        }
                    } else {
                        Circle()
                            .fill(.white.opacity(0.25))
                            .frame(width: 36, height: 36)
                    }
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(
                        theme.isOlympics ? .white.opacity(0.3) : .clear,
                        lineWidth: 2
                    )
            )
            .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
    }

    private var cardFront: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(.white)
            .overlay(
                Text(theme.emojis[card.imageIndex])
                    .font(.system(size: 36))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(
                        theme.isOlympics ? .yellow.opacity(0.6) : .clear,
                        lineWidth: 2
                    )
            )
            .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
    }
}
