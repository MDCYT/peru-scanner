import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para obtener el PHPSESSID de SkylineWebcams
 * Hace un request server-side para evitar problemas de CORS
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Usar el User-Agent del cliente o uno genérico
    const userAgent =
      request.headers.get('user-agent') ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      redirect: 'follow',
    });

    // Extraer cookies del Set-Cookie header
    const cookies = response.headers.get('set-cookie');
    
    if (!cookies) {
      return NextResponse.json(
        { error: 'No cookies found in response' },
        { status: 404 }
      );
    }

    // Buscar PHPSESSID en las cookies
    const phpsessidMatch = cookies.match(/PHPSESSID=([^;]+)/);
    
    if (!phpsessidMatch || !phpsessidMatch[1]) {
      return NextResponse.json(
        { error: 'PHPSESSID not found in cookies' },
        { status: 404 }
      );
    }

    const sessionId = phpsessidMatch[1];

    return NextResponse.json({
      sessionId,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching SkylineWebcams session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session ID', details: String(error) },
      { status: 500 }
    );
  }
}
