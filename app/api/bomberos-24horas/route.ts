import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

interface BomberosEmergencia {
  id: string;
  numparte: string;
  tipo: string;
  distrito: string;
  ubicacion: string;
  hora?: string;
  latitud?: number;
  longitud?: number;
}

interface CachedData {
  data: BomberosEmergencia[];
  timestamp: number;
}

// Caché en memoria (RAM)
let cachedEmergencias: CachedData | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

/**
 * Lee la lista de proxies desde el archivo
 */
function loadProxies(): string[] {
  try {
    const proxiesPath = path.join(process.cwd(), 'utils', 'proxies.txt');
    const content = fs.readFileSync(proxiesPath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line !== '0.0.0.0:80' && !line.startsWith('127.0.0'));
  } catch (error) {
    console.warn('No se pudo cargar proxies, usando conexión directa');
    return [];
  }
}

/**
 * Selecciona un proxy aleatorio de la lista
 */
function getRandomProxy(proxies: string[]): string | null {
  if (proxies.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

/**
 * Extrae coordenadas del formato "(-12.0828,-77.0513)"
 */
function extractCoordinates(text: string): { latitud?: number; longitud?: number } {
  const coordMatch = text.match(/\((-?\d+\.\d+),(-?\d+\.\d+)\)/);
  if (coordMatch) {
    return {
      latitud: parseFloat(coordMatch[1]),
      longitud: parseFloat(coordMatch[2]),
    };
  }
  return {};
}

/**
 * Parsea fecha en formato Perú: "12/01/2026 08:30:54 p.m."
 * Retorna ISO string con zona horaria de Perú (UTC-5)
 */
function parsePeruDate(fechaStr: string): string {
  try {
    // Formato esperado: "12/01/2026 08:30:54 p.m." o "12/01/2026 08:30:54 a.m."
    const match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(a\.m\.|p\.m\.)/i);
    
    if (!match) {
      console.warn(`Could not parse date: ${fechaStr}`);
      return new Date().toISOString();
    }

    const [, dia, mes, año, horas, minutos, segundos, ampm] = match;
    
    // Convertir a 24 horas
    let hours = parseInt(horas);
    if (ampm.toLowerCase().includes('p') && hours !== 12) {
      hours += 12;
    } else if (ampm.toLowerCase().includes('a') && hours === 12) {
      hours = 0;
    }

    // Crear fecha en formato ISO pero interpretada como hora de Perú (UTC-5)
    // DD/MM/YYYY -> YYYY-MM-DD
    const isoDateStr = `${año}-${mes}-${dia}T${String(hours).padStart(2, '0')}:${minutos}:${segundos}-05:00`;
    
    return new Date(isoDateStr).toISOString();
  } catch (error) {
    console.error(`Error parsing date "${fechaStr}":`, error);
    return new Date().toISOString();
  }
}

/**
 * Extrae el distrito del final de la ubicación
 */
function extractDistrito(ubicacion: string): string {
  const parts = ubicacion.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'Lima';
}

/**
 * Parsea la tabla HTML de emergencias en tiempo real de los bomberos
 * Con soporte para proxies y reintentos
 */
async function parseBomberos24HorasReal(): Promise<BomberosEmergencia[]> {
  const proxies = loadProxies();
  const MAX_RETRIES = 5;
  const usedProxies = new Set<string>();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let proxyUrl: string | null = null;
      let fetchOptions: RequestInit = {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-PE,es;q=0.9',
          Referer: 'https://sgonorte.bomberosperu.gob.pe/',
          'Cache-Control': 'no-cache',
        },
      };

      // Intentar con proxy si están disponibles
      if (proxies.length > 0 && attempt > 1) {
        // Buscar un proxy no usado
        const availableProxies = proxies.filter(p => !usedProxies.has(p));
        if (availableProxies.length > 0) {
          const proxy = getRandomProxy(availableProxies);
          if (proxy) {
            proxyUrl = `http://${proxy}`;
            usedProxies.add(proxy);
            console.log(`Intento ${attempt}/${MAX_RETRIES} usando proxy: ${proxy}`);
          }
        }
      } else if (attempt === 1) {
        console.log(`🔥 Intento ${attempt}/${MAX_RETRIES} - Conexión directa`);
      }

      const response = await fetch('https://sgonorte.bomberosperu.gob.pe/24horas', fetchOptions);

      if (!response.ok) {
        console.error(`Intento ${attempt} falló: ${response.status}`);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff incremental
          continue;
        }
        throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${response.status}`);
      }

      const html = await response.text();
      const $ = load(html);

      const emergencias: BomberosEmergencia[] = [];

      // Buscar tabla y parsear filas
      console.log('📋 Parsing table rows...');
      $('table tbody tr').each((index, element) => {
        try {
          const $row = $(element);
          const cells = $row.find('td');

          if (cells.length >= 4) {
            // TD[0]: numparte (dentro de span)
            const numparte = $(cells[0]).find('span').text().trim();

            // TD[1]: hora (dentro de span) - parsear en formato Perú
            const horaRaw = $(cells[1]).find('span').text().trim();
            const horaISO = parsePeruDate(horaRaw);

            // TD[2]: ubicación con coordenadas (puede estar en p)
            let ubicacionRaw = $(cells[2]).find('p').text().trim();
            if (!ubicacionRaw) {
              ubicacionRaw = $(cells[2]).text().trim();
            }

            // TD[3]: tipo (dentro de span)
            const tipo = $(cells[3]).find('span').text().trim();

            if (numparte && ubicacionRaw && tipo) {
              const { latitud, longitud } = extractCoordinates(ubicacionRaw);
              const distrito = extractDistrito(ubicacionRaw);

              emergencias.push({
                id: numparte,
                numparte,
                tipo,
                ubicacion: ubicacionRaw,
                distrito,
                hora: horaISO || undefined,
                latitud,
                longitud,
              });

              if (index < 3) {
                console.log(
                  `Parsed: ${numparte} - ${tipo.substring(0, 30)}... at (${latitud}, ${longitud})`
                );
              }
            }
          }
        } catch (rowError) {
          console.error(`Error parsing row ${index}:`, rowError);
        }
      });

      console.log(`✨ Total emergencies parsed: ${emergencias.length} (intento ${attempt})`);
      
      if (emergencias.length > 0) {
        return emergencias;
      } else if (attempt < MAX_RETRIES) {
        console.warn(`No data found, retrying with different proxy...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      throw new Error('No emergency data found after all retries');
    } catch (error) {
      console.error(`Error in attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Failed to fetch bomberos data after all retries');
}



export async function GET() {
  try {
    const now = Date.now();

    // Verificar si hay datos en caché y si aún son válidos (menos de 30 minutos)
    if (cachedEmergencias && (now - cachedEmergencias.timestamp) < CACHE_DURATION) {
      const cacheAge = Math.floor((now - cachedEmergencias.timestamp) / 1000 / 60);
      console.log(`Usando datos en caché (${cacheAge} minutos de antigüedad)`);
      
      return NextResponse.json({
        success: true,
        count: cachedEmergencias.data.length,
        data: cachedEmergencias.data,
        source: 'cache',
        cacheAge: `${cacheAge} minutos`,
        timestamp: new Date(cachedEmergencias.timestamp).toISOString(),
      });
    }

    // Caché expirado o no existe, obtener datos frescos
    console.log('Caché expirado o vacío, obteniendo datos frescos...');
    const emergencias = await parseBomberos24HorasReal();

    // Si se obtuvieron datos reales, guardarlos en caché
    if (emergencias.length > 0) {
      cachedEmergencias = {
        data: emergencias,
        timestamp: now,
      };
      
      console.log(`Datos guardados en caché (válidos por 30 minutos)`);

      return NextResponse.json({
        success: true,
        count: emergencias.length,
        data: emergencias,
        source: 'real',
        timestamp: new Date().toISOString(),
      });
    }

    // Si no hay datos nuevos pero hay caché, mantener el caché viejo
    if (cachedEmergencias) {
      const cacheAge = Math.floor((now - cachedEmergencias.timestamp) / 1000 / 60);
      console.log(`No hay datos nuevos, manteniendo caché existente (${cacheAge} minutos)`);
      
      return NextResponse.json({
        success: true,
        count: cachedEmergencias.data.length,
        data: cachedEmergencias.data,
        source: 'cache-stale',
        cacheAge: `${cacheAge} minutos`,
        timestamp: new Date(cachedEmergencias.timestamp).toISOString(),
      });
    }

    // No hay datos ni caché - retornar vacío
    console.log('No hay datos disponibles');
    return NextResponse.json({
      success: false,
      count: 0,
      data: [],
      source: 'none',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bomberos API error:', error);
    
    // Si hay caché disponible (aunque esté expirado), usarlo como fallback
    if (cachedEmergencias) {
      const cacheAge = Math.floor((Date.now() - cachedEmergencias.timestamp) / 1000 / 60);
      console.log(`Error al obtener datos, usando caché expirado (${cacheAge} minutos)`);
      
      return NextResponse.json({
        success: true,
        count: cachedEmergencias.data.length,
        data: cachedEmergencias.data,
        source: 'cache-expired-fallback',
        cacheAge: `${cacheAge} minutos`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(cachedEmergencias.timestamp).toISOString(),
      });
    }
    
    // En caso de error sin caché, retornar vacío
    console.error('No hay datos ni caché disponible');
    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        source: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
