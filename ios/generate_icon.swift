#!/usr/bin/env swift

import AppKit
import CoreGraphics

let size = 1024
let nsSize = NSSize(width: size, height: size)

let image = NSImage(size: nsSize, flipped: false) { rect in
    // Background gradient: blue -> yellow -> red (Olympics theme)
    let colors = [
        NSColor(red: 0.22, green: 0.42, blue: 0.85, alpha: 1.0).cgColor,
        NSColor(red: 0.95, green: 0.78, blue: 0.15, alpha: 1.0).cgColor,
        NSColor(red: 0.85, green: 0.22, blue: 0.28, alpha: 1.0).cgColor,
    ]
    let gradient = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: colors as CFArray,
        locations: [0.0, 0.5, 1.0]
    )!

    let ctx = NSGraphicsContext.current!.cgContext
    ctx.drawLinearGradient(
        gradient,
        start: CGPoint(x: 0, y: CGFloat(size)),
        end: CGPoint(x: CGFloat(size), y: 0),
        options: []
    )

    // Draw two overlapping "cards" in the center
    let cardWidth: CGFloat = 340
    let cardHeight: CGFloat = 440
    let cornerRadius: CGFloat = 36
    let centerY: CGFloat = CGFloat(size) / 2 + 30

    // Left card (tilted slightly left) - face down
    ctx.saveGState()
    ctx.translateBy(x: CGFloat(size) / 2 - 80, y: centerY)
    ctx.rotate(by: -0.15)

    let leftCardRect = CGRect(x: -cardWidth/2, y: -cardHeight/2, width: cardWidth, height: cardHeight)
    let leftPath = CGPath(roundedRect: leftCardRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

    // Card shadow
    ctx.setShadow(offset: CGSize(width: 4, height: -8), blur: 20, color: NSColor.black.withAlphaComponent(0.3).cgColor)
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.addPath(leftPath)
    ctx.fillPath()
    ctx.setShadow(offset: .zero, blur: 0)

    // Card face - white with question mark
    ctx.addPath(leftPath)
    ctx.clip()

    // Inner gradient for face-down card
    let cardGradient = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
            NSColor(red: 0.28, green: 0.48, blue: 0.9, alpha: 1.0).cgColor,
            NSColor(red: 0.45, green: 0.3, blue: 0.85, alpha: 1.0).cgColor,
        ] as CFArray,
        locations: [0.0, 1.0]
    )!
    ctx.drawLinearGradient(
        cardGradient,
        start: CGPoint(x: leftCardRect.minX, y: leftCardRect.maxY),
        end: CGPoint(x: leftCardRect.maxX, y: leftCardRect.minY),
        options: []
    )

    // White circle on face-down card
    let circleSize: CGFloat = 100
    ctx.setFillColor(NSColor.white.withAlphaComponent(0.25).cgColor)
    ctx.fillEllipse(in: CGRect(x: -circleSize/2, y: -circleSize/2, width: circleSize, height: circleSize))

    // Question mark on face-down card
    let questionAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 120, weight: .bold),
        .foregroundColor: NSColor.white.withAlphaComponent(0.6),
    ]
    let question = NSAttributedString(string: "?", attributes: questionAttrs)
    let qSize = question.size()
    question.draw(at: NSPoint(x: -qSize.width/2, y: -qSize.height/2))

    ctx.restoreGState()

    // Right card (tilted slightly right) - face up with emoji
    ctx.saveGState()
    ctx.translateBy(x: CGFloat(size) / 2 + 80, y: centerY)
    ctx.rotate(by: 0.15)

    let rightCardRect = CGRect(x: -cardWidth/2, y: -cardHeight/2, width: cardWidth, height: cardHeight)
    let rightPath = CGPath(roundedRect: rightCardRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

    // Card shadow
    ctx.setShadow(offset: CGSize(width: 4, height: -8), blur: 20, color: NSColor.black.withAlphaComponent(0.3).cgColor)
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.addPath(rightPath)
    ctx.fillPath()
    ctx.setShadow(offset: .zero, blur: 0)

    // Yellow border for Olympics theme
    ctx.setStrokeColor(NSColor(red: 0.95, green: 0.78, blue: 0.15, alpha: 0.7).cgColor)
    ctx.setLineWidth(6)
    ctx.addPath(rightPath)
    ctx.strokePath()

    // Star emoji on face-up card
    let emojiAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 200),
    ]
    let emoji = NSAttributedString(string: "⛷️", attributes: emojiAttrs)
    let eSize = emoji.size()
    emoji.draw(at: NSPoint(x: -eSize.width/2, y: -eSize.height/2))

    ctx.restoreGState()

    // Title text at bottom
    let titleAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 96, weight: .heavy),
        .foregroundColor: NSColor.white,
    ]
    let titleShadow = NSShadow()
    titleShadow.shadowColor = NSColor.black.withAlphaComponent(0.4)
    titleShadow.shadowOffset = NSSize(width: 2, height: -3)
    titleShadow.shadowBlurRadius = 8

    let titleAttrsWithShadow: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 96, weight: .heavy),
        .foregroundColor: NSColor.white,
        .shadow: titleShadow,
    ]
    let title = NSAttributedString(string: "MM", attributes: titleAttrsWithShadow)
    let tSize = title.size()
    title.draw(at: NSPoint(x: (CGFloat(size) - tSize.width) / 2, y: 60))

    return true
}

// Save as PNG
guard let tiffData = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiffData),
      let pngData = bitmap.representation(using: .png, properties: [:]) else {
    print("Failed to create PNG data")
    exit(1)
}

let outputPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "AppIcon.png"

do {
    try pngData.write(to: URL(fileURLWithPath: outputPath))
    print("Icon saved to \(outputPath)")
} catch {
    print("Failed to save: \(error)")
    exit(1)
}
