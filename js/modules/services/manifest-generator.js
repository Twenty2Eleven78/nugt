/**
 * Manifest Generator
 * Generates PWA manifest based on configuration
 */

import { config } from '../shared/config.js';

/**
 * Generate PWA manifest based on current configuration
 * @returns {Object} Manifest object
 */
export function generateManifest() {
  const appName = config.get('app.name', 'NUFC GameTime');
  const shortName = config.get('app.shortName', 'NUGT');
  const description = config.get('app.description', 'Football match tracking application');
  const themeColor = config.get('team.clubColors.primary', '#dc3545');
  const clubName = config.get('team.clubName', 'Netherton United');

  return {
    name: `${clubName} Game Time App`,
    short_name: shortName,
    start_url: "./",
    scope: "./",
    theme_color: themeColor,
    background_color: "#ffffff",
    display: "standalone",
    description: description,
    icons: [
      {
        src: "./favicon.ico",
        sizes: "16x16 32x32",
        type: "image/x-icon"
      },
      {
        src: "./nugt512.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "./nugt512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "./nugt512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    id: shortName,
    lang: "en",
    orientation: "portrait-primary",
    categories: [
      "sports",
      "utilities"
    ],
    display_override: [
      "window-controls-overlay",
      "standalone"
    ],
    launch_handler: {
      client_mode: [
        "focus-existing",
        "auto"
      ]
    },
    handle_links: "preferred",
    prefer_related_applications: false,
    edge_side_panel: {
      preferred_width: 400
    },
    screenshots: [],
    shortcuts: [
      {
        name: "New Match",
        short_name: "New Match",
        description: "Start a new football match",
        url: "./?action=new-match",
        icons: [
          {
            src: "./nugt512.png",
            sizes: "192x192"
          }
        ]
      }
    ]
  };
}

/**
 * Update the page title based on configuration
 */
export function updatePageTitle() {
  const appName = config.get('app.name', 'NUFC GameTime');
  const version = config.get('app.version', '4.0');
  document.title = `${appName} v${version}`;
}

/**
 * Update theme color meta tag
 */
export function updateThemeColor() {
  const themeColor = config.get('team.clubColors.primary', '#dc3545');
  
  // Update theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = themeColor;

  // Update msapplication-TileColor
  let tileMeta = document.querySelector('meta[name="msapplication-TileColor"]');
  if (!tileMeta) {
    tileMeta = document.createElement('meta');
    tileMeta.name = 'msapplication-TileColor';
    document.head.appendChild(tileMeta);
  }
  tileMeta.content = themeColor;
}

/**
 * Initialize manifest-related updates
 */
export function initManifest() {
  updatePageTitle();
  updateThemeColor();
  
  // Update manifest link if needed (for dynamic manifest generation)
  // This would require server-side support or service worker intervention
}