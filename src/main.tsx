import { createRoot } from 'react-dom/client';
import App from "./App.tsx";
import "./index.css";

// Gestion des erreurs pour l'iframe parent (ne pas toucher)
if (typeof window !== "undefined") {
  const sendToParent = (data: any) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, "*");
      }
    } catch {}
  };

  window.addEventListener("error", (event) => {
    console.log("[Runtime Error]", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: "window.onerror",
      },
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.log("[Unhandled Promise Rejection]", event.reason);

    const reason: any = event.reason;
    const message =
      typeof reason === "object" && reason?.message
        ? String(reason.message)
        : String(reason);
    const stack = typeof reason === "object" ? reason?.stack : undefined;

    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message,
        stack,
        filename: undefined,
        lineno: undefined,
        colno: undefined,
        source: "unhandledrejection",
      },
      timestamp: Date.now(),
    });
  });
}

// Rendu de l'application
createRoot(document.getElementById("root")!).render(<App />);

// 👇 ENREGISTREMENT DU SERVICE WORKER (CORRIGÉ) 👇
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ajout de { type: 'module' } pour supporter les imports dans sw.ts en mode dev
    navigator.serviceWorker.register('/sw.js', { type: 'module' })
      .then(registration => {
        console.log('✅ Service Worker enregistré avec succès:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}
