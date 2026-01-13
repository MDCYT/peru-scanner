import { NextResponse } from "next/server";

interface IndeciFeature {
  attributes: {
    OBJECTID: number;
    NUM_POSX: number;
    NUM_POSY: number;
    FENOMENO: string;
    DESCRIPCION: string;
    DISTRITO: string;
    PROVINCIA: string;
    REGION: string;
    FECHA: number;
    AFECTADOS_DIRECTOS: number;
  };
  geometry: {
    x: number;
    y: number;
  };
}

interface IndeciBruta {
  features: IndeciFeature[];
  exceededTransferLimit?: boolean;
}

interface EmergenciaFormato {
  id: string;
  codigoSinpad: string;
  tipo: string;
  descripcion: string;
  ubicacion: string;
  distrito: string;
  provincia: string;
  region: string;
  fecha: string; // ISO format
  latitud: number;
  longitud: number;
  afectados: number;
  fuente: "indeci" | "bomberos";
}

// Caché en memoria
let cachedEmergenciasINDECI: {
  data: EmergenciaFormato[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Funciones auxiliares
function getEmergenciaTypeINDECI(fenomeno: string): string {
  const fenomenoUpper = fenomeno?.toUpperCase() || "";

  if (
    fenomenoUpper.includes("LLUVIA") ||
    fenomenoUpper.includes("TORMENTA")
  ) {
    return "LLUVIA INTENSA";
  }
  if (
    fenomenoUpper.includes("DESLIZA") ||
    fenomenoUpper.includes("DERRUMBE")
  ) {
    return "DESLIZAMIENTO";
  }
  if (fenomenoUpper.includes("INUNDA")) {
    return "INUNDACION";
  }
  if (fenomenoUpper.includes("SISMO") || fenomenoUpper.includes("TERREMOTO")) {
    return "SISMO";
  }
  if (fenomenoUpper.includes("HELADA") || fenomenoUpper.includes("FRIO")) {
    return "HELADA";
  }
  if (fenomenoUpper.includes("SEQUIA") || fenomenoUpper.includes("DÉFICIT")) {
    return "SEQUIA";
  }
  if (fenomenoUpper.includes("INCENDIO") || fenomenoUpper.includes("FUEGO")) {
    return "INCENDIO FORESTAL";
  }
  if (fenomenoUpper.includes("VANDALISMO")) {
    return "VANDALISMO";
  }
  if (fenomenoUpper.includes("ACCIDENTE")) {
    return "ACCIDENTE";
  }

  return fenomeno || "OTRO";
}

function convertTimestampToISO(timestampMs: number): string {
  // El timestamp está en milisegundos, convertir a segundos
  const date = new Date(timestampMs);
  return date.toISOString();
}

async function fetchIndeciBruto(): Promise<EmergenciaFormato[]> {
  try {
    const url =
      "https://geosinpad.indeci.gob.pe/indeci/rest/services/Emergencias/EMERGENCIAS_SINPAD/FeatureServer/0/query?where=FECHA%3E=CURRENT_TIMESTAMP-1&outFields=*&returnGeometry=true&f=json";

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://geosinpad.indeci.gob.pe",
      },
    });

    if (!response.ok) {
      throw new Error(`INDECI API error: ${response.status}`);
    }

    const data = (await response.json()) as IndeciBruta;

    if (!data.features || data.features.length === 0) {
      console.log("⚠️ INDECI: No features returned");
      return [];
    }

    console.log(`✅ INDECI: ${data.features.length} emergencias obtenidas`);

    const emergencias: EmergenciaFormato[] = data.features.map((feature, idx) => ({
      id: `indeci-${feature.attributes.OBJECTID || idx}`,
      codigoSinpad: `INDECI-${feature.attributes.OBJECTID || idx}`,
      tipo: getEmergenciaTypeINDECI(feature.attributes.FENOMENO),
      descripcion: feature.attributes.DESCRIPCION || feature.attributes.FENOMENO,
      ubicacion: feature.attributes.DISTRITO || "Ubicación desconocida",
      distrito: feature.attributes.DISTRITO || "",
      provincia: feature.attributes.PROVINCIA || "",
      region: feature.attributes.REGION || "",
      fecha: convertTimestampToISO(feature.attributes.FECHA),
      latitud: feature.geometry?.y || feature.attributes.NUM_POSY || 0,
      longitud: feature.geometry?.x || feature.attributes.NUM_POSX || 0,
      afectados: feature.attributes.AFECTADOS_DIRECTOS || 0,
      fuente: "indeci",
    }));

    return emergencias;
  } catch (error) {
    console.error("❌ Error fetching INDECI:", error);
    return [];
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // Verificar caché válido
    if (
      cachedEmergenciasINDECI &&
      now - cachedEmergenciasINDECI.timestamp < CACHE_DURATION
    ) {
      const cacheAgeMinutes = Math.floor(
        (now - cachedEmergenciasINDECI.timestamp) / 60000
      );
      console.log(
        `💾 INDECI: Usando datos en caché (${cacheAgeMinutes} minutos)`
      );

      return NextResponse.json({
        success: true,
        count: cachedEmergenciasINDECI.data.length,
        data: cachedEmergenciasINDECI.data,
        source: "cache",
        timestamp: new Date(cachedEmergenciasINDECI.timestamp).toISOString(),
        cacheAge: cacheAgeMinutes,
      });
    }

    // Caché expirado o no existe - obtener datos frescos
    console.log("🔄 INDECI: Caché expirado o no existe, obteniendo datos frescos");

    const emergencias = await fetchIndeciBruto();

    if (emergencias.length > 0) {
      cachedEmergenciasINDECI = {
        data: emergencias,
        timestamp: now,
      };

      return NextResponse.json({
        success: true,
        count: emergencias.length,
        data: emergencias,
        source: "real",
        timestamp: new Date(now).toISOString(),
      });
    }

    // Si no hay datos frescos, devolver caché expirado si existe
    if (cachedEmergenciasINDECI) {
      console.log("⚠️ INDECI: Usando caché expirado como fallback");
      return NextResponse.json({
        success: true,
        count: cachedEmergenciasINDECI.data.length,
        data: cachedEmergenciasINDECI.data,
        source: "expired-cache",
        timestamp: new Date(cachedEmergenciasINDECI.timestamp).toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      count: 0,
      data: [],
      error: "No data available",
    });
  } catch (error) {
    console.error("❌ INDECI route error:", error);

    // Fallback a caché expirado
    if (cachedEmergenciasINDECI) {
      return NextResponse.json({
        success: true,
        count: cachedEmergenciasINDECI.data.length,
        data: cachedEmergenciasINDECI.data,
        source: "expired-cache-fallback",
        timestamp: new Date(cachedEmergenciasINDECI.timestamp).toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      count: 0,
      data: [],
      error: "Failed to fetch INDECI data",
    });
  }
}
