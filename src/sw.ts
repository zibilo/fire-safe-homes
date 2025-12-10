import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// --- 1. INTÉGRATION ONESIGNAL ---
// C'est cette ligne magique qui remplace vos 50 lignes de code manuel.
// Elle charge le moteur de OneSignal directement.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');

self.skipWaiting()
clientsClaim()

// --- 2. GESTION DU CACHE PWA (On garde, c'est parfait) ---
cleanupOutdatedCaches()
// @ts-expect-error
precacheAndRoute(self.__WB_MANIFEST)

// --- 3. ROUTAGE HORS LIGNE (On garde aussi) ---
const handler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    new RegExp('^/api/'),
    new RegExp('^/storage/'),
  ],
})
registerRoute(navigationRoute)

// J'ai supprimé les sections "3. ÉCOUTEUR PUSH" et "4. GESTION DU CLIC".
// OneSignal gère maintenant l'affichage, le titre, l'icône et le clic automatiquement.