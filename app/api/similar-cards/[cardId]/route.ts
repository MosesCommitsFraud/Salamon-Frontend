import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { cardId: string } }
) {
    try {
        const cardId = params.cardId;

        // Default number of similar cards to fetch
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get("limit") || "12";

        console.log(`Fetching similar cards for card ID: ${cardId}`);

        // Forward the request to our FastAPI backend
        // Make sure the port matches your FastAPI server
        const response = await fetch(`http://localhost:8000/api/similar/${cardId}?top_n=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            // Removed timeout to allow requests to run indefinitely
        });

        // Log response status to help debug
        console.log(`API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Similar cards API error:", errorText);

            // If we get a 404, it might be because the card isn't in the embeddings
            if (response.status === 404) {
                return NextResponse.json(
                    {
                        selected_card: { id: cardId },
                        similar_cards: [],
                        message: "Card not found in embeddings database"
                    },
                    { status: 200 } // Return 200 even for not found cards to display the message to user
                );
            }

            throw new Error(`Similar cards service returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Successfully received similar cards");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in similar-cards API route:", error);

        // Check if it's a connection error
        const isConnectionError = error instanceof Error &&
            (error.message.includes("ECONNREFUSED") ||
                error.message.includes("Failed to fetch") ||
                error.message.includes("timeout"));

        if (isConnectionError) {
            return NextResponse.json(
                {
                    error: "Could not connect to similarity service. Make sure the FastAPI backend is running.",
                    similar_cards: [],
                    backend_connection_error: true
                },
                { status: 503 } // Service Unavailable
            );
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch similar cards",
                similar_cards: []
            },
            { status: 500 },
        );
    }
}