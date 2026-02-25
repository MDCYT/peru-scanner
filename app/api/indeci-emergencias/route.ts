import { NextResponse } from "next/server";

const EXTERNAL_INDECI_URL = "https://api.mdcdev.me/v2/peru/indeci/incidentes";

export async function GET() {
  try {
    const response = await fetch(EXTERNAL_INDECI_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = `External INDECI API error: ${response.status}`;
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
    console.error("INDECI API proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
