// Fichier : test-cle.mjs (Script Node.js client)

import fs from "fs";
import fetch from "node-fetch";

// Assurez-vous que l'image 'plan.png' est dans le même dossier
const imagePath = "./plan.png"; 
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString("base64");

const url = "https://sfgncyerlcditfepasjo.supabase.co/functions/v1/analyze-plan";
// Note : Le prompt du client n'est plus utilisé par l'Edge Function

async function analyzePlan() {
  console.log("Envoi du plan à l'Edge Function...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: imageBase64,
        houseId: "votre-id-de-maison-optionnel" // Peut être retiré si non utilisé
      }),
    });

    // Gestion des erreurs de connexion ou de l'Edge Function
    const data = await response.json();
    
    if (!response.ok || data.error) {
        console.error("❌ Échec de la Edge Function (Edge ou Gemini Erreur):", data.error || `Statut HTTP: ${response.status}`);
        return;
    }

    // Récupérer le résumé renvoyé par Supabase
    const output = data?.analysis?.summary ?? "Rapport complet manquant (Erreur d'analyse).";
    
    console.log("=====================================");
    console.log("✅ RAPPORT FIREBOT (Analyse IA)");
    console.log("=====================================");
    console.log(output);
    console.log("=====================================");

  } catch (err) {
    console.error("❌ Erreur de connexion ou traitement :", err);
  }
}

analyzePlan();