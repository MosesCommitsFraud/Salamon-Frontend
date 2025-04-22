import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Sending deck to AI service for recommendations...");

    // Forward the request to our FastAPI backend
    const response = await fetch("http://localhost:8000/api/generate-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // Removed timeout to allow requests to run indefinitely
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", errorText);
      throw new Error(`AI service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Successfully received AI recommendations");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generate-deck API route:", error);
    return NextResponse.json(
        {
          error:
              error instanceof Error
                  ? error.message
                  : "Failed to generate deck recommendations",
        },
        { status: 500 },
    );
  }
}