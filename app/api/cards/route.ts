// app/api/cards/route.ts
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Beispiel: YGOPRODECK-Daten
        const res = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php", {
            // Serverseitiges Revalidate für 1 Tag
            next: { revalidate: 86400 },
        })
        if (!res.ok) throw new Error("Fehler beim Karten-Fetch")

        const data = await res.json() // { data: [...] }
        return NextResponse.json(data)
    } catch (error) {
        console.error("Fehler beim Laden der Karten:", error)
        return NextResponse.json({ data: [] }, { status: 500 })
    }
}
