require('dotenv').config();
const fetch = require('node-fetch');

// Simplified version of the TypeScript implementation for testing
async function geocode(addr) {
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

async function melissaValidation(addr) {
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
    id: process.env.MELISSA_KEY,
    a1: streetAddress,
    format: "json"
  });
  
  if (city) params.append("loc", city);
  if (state) params.append("admarea", state);
  if (postal) params.append("postal", postal);
  params.append("ctry", "USA");

  const url = `https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress?${params.toString()}`;
  console.log("Melissa API URL:", url);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log("📝 Melissa API Response:", JSON.stringify(data, null, 2));
    
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

async function openStreetMapGeocode(addr) {
  const query = encodeURIComponent(addr);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
  
  const headers = {
    'User-Agent': 'MelissaHackathonProject/1.0'
  };

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

async function testGeocode() {
  try {
    const result = await geocode("134 Denslow Ave Los Angeles CA");
    console.log("\n🌍 Final geocoding result:");
    console.log(result);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testGeocode();