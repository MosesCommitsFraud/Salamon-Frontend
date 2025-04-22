import { NextResponse } from "next/server";
import { findRelevantContent } from "@/lib/ai/tools/search";

export async function GET(req: Request) {
    try {
        // Den Query-Parameter aus der URL extrahieren
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");
        console.log(query);

        // Prüfen, ob der Parameter vorhanden ist
        if (!query) {
            return NextResponse.json({ error: "Kein Query-Parameter übergeben" }, { status: 400 });
        }

        // Die Funktion mit dem übergebenen Query-Parameter aufrufen
        const results = await findRelevantContent(query);
        return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
