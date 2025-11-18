# PWA Icons

This directory contains app icons for the Progressive Web App (PWA) functionality.

## Required Icons

The following icon sizes are required for optimal PWA support across all devices:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

### Option 1: Using a Design Tool
1. Create a 512x512px icon in Figma, Adobe Illustrator, or similar
2. Export to PNG at each required size
3. Place files in this directory

### Option 2: Using an Online Generator
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo (minimum 512x512px)
3. Download the generated icon package
4. Extract and place in this directory

### Option 3: Using CLI Tool
```bash
npm install -g pwa-asset-generator
pwa-asset-generator logo.svg ./public/icons --icon-only
```

## Design Guidelines

- **Safe Zone**: Keep important content within center 80% of icon
- **Background**: Use solid color or simple gradient
- **Contrast**: Ensure icon is visible on both light and dark backgrounds
- **Format**: PNG with transparency (except for background color)
- **Color**: Match your brand colors

## Testing

After adding icons, test the PWA:
1. Build the app: `npm run build`
2. Serve locally: `npm start`
3. Open Chrome DevTools > Application > Manifest
4. Verify all icons load correctly

## Current Status

⚠️ **Placeholder icons needed** - Add your brand's icons to this directory
