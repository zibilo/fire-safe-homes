import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTaggerPlugin } from "./src/visual-edits/component-tagger-plugin.js";
import { VitePWA } from "vite-plugin-pwa";

// Plugin utilitaire pour afficher les erreurs d'overlay dans la console
const logErrorsPlugin = () => ({
  name: "log-errors-plugin",
  transformIndexHtml() {
    return {
      tags: [
        {
          tag: "script",
          injectTo: "head",
          children: `(() => {
            try {
              const logOverlay = () => {
                const el = document.querySelector('vite-error-overlay');
                if (!el) return;
                const root = (el.shadowRoot || el);
                let text = '';
                try { text = root.textContent || ''; } catch (_) {}
                if (text && text.trim()) {
                  const msg = text.trim();
                  console.error('[Vite Overlay]', msg);
                  try {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({
                        type: 'ERROR_CAPTURED',
                        error: {
                          message: msg,
                          source: 'vite.overlay',
                        },
                        timestamp: Date.now(),
                      }, '*');
                    }
                  } catch (_) {}
                }
              };
              const obs = new MutationObserver(() => logOverlay());
              obs.observe(document.documentElement, { childList: true, subtree: true });
              window.addEventListener('DOMContentLoaded', logOverlay);
              logOverlay();
            } catch (e) {
              console.warn('[Vite Overlay logger failed]', e);
            }
          })();`
        }
      ]
    };
  },
});

// Configuration principale
export default defineConfig(({ mode }) => ({
  server: {
    host: "",
    port: ,
  },
  plugins: [
    react(),
    logErrorsPlugin(),
    mode === 'development' && componentTaggerPlugin(),
    
    // --- CONFIGURATION PWA COMPLETE ---
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest', // Utilise votre fichier src/sw.ts
      srcDir: 'src',
      filename: 'sw.ts',

      // Configuration critique pour le build et la détection
      injectManifest: {
        // Augmente la limite de taille pour éviter l'erreur de build (5 Mo)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Force le nom du fichier en sortie à 'sw.js' (au lieu de sw.mjs) pour PWA Builder
        rollupOptions: {
          output: {
            format: 'es',
            entryFileNames: 'sw.js', 
          },
        },
      },

      // Active le SW en local pour tester
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // Fichiers statiques à inclure dans le cache
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],

      // Manifeste pour l'installation
      manifest: {
        name: 'Secure Pompiers Congo',
        short_name: 'FireSafe',
        description: 'Application officielle de gestion et prévention des incendies au Congo.',
        theme_color: '#C41E25',
        background_color: '#10141D',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        launch_handler: {
          client_mode: "navigate-existing"
        },
        start_url: '/',
        scope: '/',
        id: '/',
        
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        
        // Captures d'écran pour les stores
        screenshots: [
          {
            src: "/pwa-512x512.png", // Idéalement, remplacez par de vraies captures
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Accueil Mobile"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Tableau de bord Desktop"
          }
        ],

        // Raccourcis d'appui long
        shortcuts: [
          {
            name: "Urgence",
            short_name: "Urgence",
            description: "Signaler une urgence immédiatement",
            url: "/register-house",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Actualités",
            short_name: "Blog",
            description: "Voir les derniers conseils de sécurité",
            url: "/blog",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          }
        ],
        
        categories: ["utilities", "safety", "productivity"],
        lang: "fr",
        dir: "ltr",
        prefer_related_applications: false,
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
