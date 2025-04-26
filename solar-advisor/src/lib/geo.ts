import fetch from "node-fetch";

export interface GeoOut {
  lat: number;
  lng: number;
  std: string;
  melissaVerified: boolean;  // Flag to indicate Melissa verification
}

// Main geocode function
export async function geocode(addr: string): Promise<GeoOut> {
  // First try to validate with Melissa
  try {
    const melissaResult = await melissaValidation(addr);
    console.log("✅ Address validated with Melissa:", melissaResult.standardizedAddress);
    
    // Use OpenStreetMap for geocoding
    const coordinates = await openStreetMapGeocode(melissaResult.standardizedAddress || addr);
    
    // Return combined result
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      std: melissaResult.standardizedAddress || coordinates.std,
      melissaVerified: melissaResult.verified
    };
  } catch (error) {
    console.log("⚠️ Melissa validation failed, using OpenStreetMap only");
    
    // Fallback to just OpenStreetMap
    const coordinates = await openStreetMapGeocode(addr);
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      std: coordinates.std,
      melissaVerified: false
    };
  }
}

// Melissa address validation function
async function melissaValidation(addr: string): Promise<{
  standardizedAddress: string | null;
  verified: boolean;
}> {
  // Parse address components
  const parts = addr.split(/,\s*/);
  let streetAddress = addr;
  let city = "";
  let state = "";
  let postal = "";
  
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].trim().split(/\s+/);
    if (lastPart.length >= 2) {
      state = lastPart[lastPart.length - 1];
      const zipMatch = state.match(/^(\d{5})(-\d{4})?$/);
      if (zipMatch) {
        postal = zipMatch[0];
        state = lastPart[lastPart.length - 2];
      }
      city = lastPart.slice(0, state === lastPart[lastPart.length - 1] ? -1 : -2).join(" ");
      streetAddress = parts.slice(0, -1).join(", ");
    }
  }

  // Build parameters for Melissa API
  const params = new URLSearchParams({
    id: process.env.MELISSA_KEY!,
    a1: streetAddress,
    format: "json"
  });
  
  if (city) params.append("loc", city);
  if (state) params.append("admarea", state);
  if (postal) params.append("postal", postal);
  params.append("ctry", "USA");

  const url = `https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress?${params.toString()}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // Log the Melissa API usage for documentation
    console.log("📝 Melissa API call made for address validation");
    
    if (!data.Records || data.Records.length === 0) {
      return { standardizedAddress: null, verified: false };
    }
    
    const rec = data.Records[0];
    
    // Check if we got any useful address data back
    if (rec.AddressLine1) {
      let standardized = rec.AddressLine1;
      if (rec.Locality) standardized += `, ${rec.Locality}`;
      if (rec.AdministrativeArea) standardized += ` ${rec.AdministrativeArea}`;
      if (rec.PostalCode) standardized += ` ${rec.PostalCode}`;
      
      return { 
        standardizedAddress: standardized, 
        verified: true 
      };
    }
    
    return { standardizedAddress: null, verified: false };
  } catch (error) {
    console.error("Melissa API error:", error);
    return { standardizedAddress: null, verified: false };
  }
}

// OpenStreetMap geocoding function
async function openStreetMapGeocode(addr: string): Promise<{
  lat: number;
  lng: number;
  std: string;
}> {
  const query = encodeURIComponent(addr);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
  
  const headers = {
    'User-Agent': 'MelissaHackathonProject/1.0'
  };

  // Add a small delay to respect Nominatim's usage policy
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      throw new Error("Address not found");
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      std: result.display_name
    };
  } catch (error) {
    throw new Error(`OpenStreetMap geocoding failed: ${error.message}`);
  }
}