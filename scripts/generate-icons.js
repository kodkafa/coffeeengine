#!/usr/bin/env node

/**
 * Generate icon files from coffe3ngine-logo.svg
 * 
 * This script requires sharp to be installed:
 * npm install --save-dev sharp
 * 
 * Usage: node scripts/generate-icons.js
 */

const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const sourceSvg = path.join(__dirname, "../public/coffe3ngine-logo.svg")
const publicDir = path.join(__dirname, "../public")

async function generateIcons() {
  try {
    // Read source SVG
    const svgBuffer = fs.readFileSync(sourceSvg)

    // Generate apple-icon.png (180x180 for Apple touch icon)
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(publicDir, "apple-icon.png"))

    console.log("✓ Generated apple-icon.png")

    // Generate icon-light-32x32.png (light mode, black icon on white)
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(publicDir, "icon-light-32x32.png"))

    console.log("✓ Generated icon-light-32x32.png")

    // Generate icon-dark-32x32.png (dark mode, white icon on transparent/black)
    // First invert colors, then set background
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(publicDir, "icon-dark-32x32.png"))

    console.log("✓ Generated icon-dark-32x32.png")

    // Generate placeholder-logo.png (from logotype, larger size)
    const logotypeSvg = path.join(__dirname, "../public/coffe3ngine.svg")
    const logotypeBuffer = fs.readFileSync(logotypeSvg)

    await sharp(logotypeBuffer)
      .resize(400, null, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(publicDir, "placeholder-logo.png"))

    console.log("✓ Generated placeholder-logo.png")

    console.log("\n✅ All icons generated successfully!")
  } catch (error) {
    console.error("❌ Error generating icons:", error)
    process.exit(1)
  }
}

// Check if sharp is installed
try {
  require.resolve("sharp")
  generateIcons()
} catch (e) {
  console.error(
    "❌ Error: sharp is not installed. Please run: npm install --save-dev sharp"
  )
  process.exit(1)
}

