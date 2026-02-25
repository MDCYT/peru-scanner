import { NextResponse } from 'next/server';

const EXTERNAL_BOMBEROS_URL = 'https://api.mdcdev.me/v2/peru/bomberos/incidentes';

export async function GET() {
  try {
    const response = await fetch(EXTERNAL_BOMBEROS_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = `External bomberos API error: ${response.status}`;
      console.error(message);
      return NextResponse.json(
        {
          success: false,
          error: message,
          status: response.status,
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Bomberos API proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
