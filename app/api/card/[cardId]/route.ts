// app/api/card/[cardId]/route.ts
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ cardId: string }> }
) {
    const { cardId } = await params;
    const FAST_API_URL = "http://0.0.0.0:8000";

    try {
        const response = await fetch(`${FAST_API_URL}/card/${cardId}`);
        if (!response.ok) {
            return NextResponse.json({ error: "Card not found" }, { status: response.status });
        }
        const cardData = await response.json();
        return NextResponse.json(cardData, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
