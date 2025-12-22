/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

// --- 1. INTÉGRATION ONESIGNAL ---
(self as unknown as { importScripts: (url: string) => void }).importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');

(self as unknown as { skipWaiting: () => void }).skipWaiting()
clientsClaim()

// --- 2. GESTION DU CACHE PWA ---
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// --- 3. ROUTAGE HORS LIGNE ---
const handler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    new RegExp('^/api/'),
    new RegExp('^/storage/'),
  ],
})
registerRoute(navigationRoute)
