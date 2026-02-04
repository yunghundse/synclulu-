/**
 * privacyAwareLocation.ts
 * Privacy-First Location System
 *
 * KEINE automatischen Permission-Popups!
 * Nutzt IP-Geolocation als Fallback
 */

export interface QuickLocation {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
  isApproximate: boolean;
}

// Cache für IP-Location (5 Minuten)
let cachedIPLocation: QuickLocation | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

/**
 * Holt eine grobe Location via IP-Geolocation
 * KEIN Permission-Popup nötig!
 */
export async function getQuickLocation(): Promise<QuickLocation | null> {
  // Check Cache
  if (cachedIPLocation && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedIPLocation;
  }

  try {
    // Versuche ipapi.co (kostenlos, kein API Key)
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('IP-API nicht erreichbar');
    }

    const data = await response.json();

    if (data.latitude && data.longitude) {
      cachedIPLocation = {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        isApproximate: true,
      };
      cacheTimestamp = Date.now();
      return cachedIPLocation;
    }

    return null;
  } catch (error) {
    console.log('[PrivacyLocation] IP-Geolocation fehlgeschlagen:', error);

    // Fallback: Versuche ip-api.com
    try {
      const fallbackResponse = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName,country');
      const fallbackData = await fallbackResponse.json();

      if (fallbackData.lat && fallbackData.lon) {
        cachedIPLocation = {
          lat: fallbackData.lat,
          lng: fallbackData.lon,
          city: fallbackData.city,
          region: fallbackData.regionName,
          country: fallbackData.country,
          isApproximate: true,
        };
        cacheTimestamp = Date.now();
        return cachedIPLocation;
      }
    } catch (fallbackError) {
      console.log('[PrivacyLocation] Fallback auch fehlgeschlagen');
    }

    return null;
  }
}

/**
 * Holt präzise GPS-Location - NUR wenn User explizit klickt!
 * Zeigt Permission-Dialog nur bei expliziter User-Aktion
 */
export async function getPreciseLocationOnDemand(): Promise<QuickLocation | null> {
  if (!navigator.geolocation) {
    console.log('[PrivacyLocation] Geolocation nicht unterstützt');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isApproximate: false,
        });
      },
      (error) => {
        console.log('[PrivacyLocation] GPS-Fehler:', error.message);
        // Bei Fehler: Fallback auf IP-Location
        getQuickLocation().then(resolve);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Prüft ob GPS-Permission bereits erteilt wurde
 * OHNE ein Popup zu triggern!
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Standard-Location für Deutschland wenn alles fehlschlägt
 */
export function getDefaultLocation(): QuickLocation {
  return {
    lat: 51.1657, // Mitte von Deutschland
    lng: 10.4515,
    city: 'Deutschland',
    isApproximate: true,
  };
}

export default {
  getQuickLocation,
  getPreciseLocationOnDemand,
  checkLocationPermission,
  getDefaultLocation,
};
