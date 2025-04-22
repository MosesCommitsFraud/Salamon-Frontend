import { NextRequest, NextResponse } from "next/server";

/**
 * Beispiel-Route in Next.js 13 (App-Router).
 * Ruft deine Python-FastAPI-Instanz auf, die unter http://localhost:8000/graph lauscht.
 *
 * Aufruf im Frontend:
 *
 * fetch("/api/graph", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     decks: [
 *       {
 *         name: "Mermail Deck",
 *         main: [{ "41546": 2 }, { "32864": 1 }],
 *         extra: [],
 *         side: []
 *       }
 *     ]
 *   })
 * })
 *   .then(res => res.json())
 *   .then(data => {
 *     // data = { nodes: [...], links: [...] }
 *   });
 */
export async function POST(request: NextRequest) {
  try {
    // Body aus dem Request holen
    const body = await request.json();

    // URL zu deiner Python-FastAPI
    // Du kannst den Wert z.B. in einer .env-Datei halten und via process.env.PYTHON_API_URL abrufen
    const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://0.0.0.0:8000/graph";

    // Weiterleitung der Daten an die Python-API
    const pythonRes = await fetch(PYTHON_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!pythonRes.ok) {
      // Falls die Python-API einen Fehlerstatus liefert (z.B. 400, 500)
      return NextResponse.json(
          { error: `Python API Error: ${pythonRes.status}` },
          { status: pythonRes.status }
      );
    }

    // Antwort der Python-API parsen
    const data = await pythonRes.json();

    // Und als JSON an den Client zurückgeben
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error in Next.js /api/graph route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
