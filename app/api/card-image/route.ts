// app/api/card-image/route.ts (Next.js 13 mit Route Handler)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Beispiel: Du übergibst die tatsächliche Bild-URL als Query-Parameter ?url=...
        const { searchParams } = new URL(request.url);
        const externalUrl = searchParams.get('url');

        if (!externalUrl) {
            return new NextResponse('No URL specified', { status: 400 });
        }

        // Bild vom externen Server holen
        const externalRes = await fetch(externalUrl);
        if (!externalRes.ok) {
            return new NextResponse('Failed to fetch external image', { status: 500 });
        }

        // ArrayBuffer für das Bild holen
        const imageBuffer = await externalRes.arrayBuffer();

        // Jetzt eine Antwort erstellen, bei der wir selbst CORS setzen
        // (Access-Control-Allow-Origin am besten nur so weit öffnen, wie nötig)
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': externalRes.headers.get('Content-Type') || 'image/jpeg',
                'Content-Length': String(imageBuffer.byteLength),
                'Access-Control-Allow-Origin': '*', // oder deine Domain
            },
        });
    } catch (error) {
        console.error(error);
        return new NextResponse('Server Error', { status: 500 });
    }
}
