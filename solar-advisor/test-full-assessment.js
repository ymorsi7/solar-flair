// Comprehensive test for the full solar assessment pipeline
require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs').promises;

// Mock the Gemini Vision API if needed
async function mockRoofVision() {
  return {
    usableAreaM2: 85,
    shadePct: 15
  };
}

// Geocoding function (using our hybrid approach)
async function geocode(addr) {
  try {
    // First try Melissa
    const melissaResult = await melissaValidation(addr);
    console.log("✅ Address validated with Melissa:", melissaResult.standardizedAddress);
    
    // Then geocode with OpenStreetMap
    const coordinates = await openStreetMapGeocode(melissaResult.standardizedAddress || addr);
    
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      std: melissaResult.standardizedAddress || coordinates.std,
      melissaVerified: melissaResult.verified
    };
  } catch (error) {
    console.log("⚠️ Melissa validation failed, using OpenStreetMap only");
    
    // Fallback to OpenStreetMap
    const coordinates = await openStreetMapGeocode(addr);
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      std: coordinates.std,
      melissaVerified: false
    };
  }
}

// Melissa address validation
async function melissaValidation(addr) {
  const params = new URLSearchParams({
    id: process.env.MELISSA_KEY,
    a1: addr,
    format: "json",
    ctry: "USA"
  });

  const url = `https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress?${params.toString()}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log("📝 Melissa API Response received");
    
    if (!data.Records || data.Records.length === 0) {
      return { standardizedAddress: null, verified: false };
    }
    
    const rec = data.Records[0];
    
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

// OpenStreetMap geocoding
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

// Solar API function
async function getSolar(geo) {
  try {
    // Try Google Solar API first
    const primary = await solarInsights(geo);
    if (primary) {
      console.log("✅ Google Solar API data received");
      return primary;
    }
    
    // Fall back to NREL PVWatts
    console.log("⚠️ Google Solar API failed, using NREL PVWatts");
    const backup = await pvWatts(geo);
    console.log("✅ NREL PVWatts data received");
    return backup;
  } catch (error) {
    console.error("Solar API error:", error);
    // Return mock data if both APIs fail
    return {
      annualKwh: 7500,
      roofAzimuthDeg: 180,
      roofTiltDeg: 20,
      panelCapacityKw: 5
    };
  }
}

// Google Solar API
async function solarInsights(geo) {
  if (!process.env.GOOGLE_SOLAR_KEY) {
    console.log("⚠️ No Google Solar API key found, skipping");
    return null;
  }
  
  const key = process.env.GOOGLE_SOLAR_KEY;
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${geo.lat}&location.longitude=${geo.lng}&key=${key}`;
  
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    
    const j = await r.json();
    if (!j.buildingInsights?.solarPotential) return null;

    const pot = j.buildingInsights.solarPotential;
    return {
      annualKwh: pot.whYearly / 1000,
      roofAzimuthDeg: pot.optimalTiltAzimuthDegrees,
      roofTiltDeg: pot.optimalTiltDegrees,
      panelCapacityKw: pot.maxArrayPanelsCount * pot.panelCapacityWatts / 1000
    };
  } catch (error) {
    console.error("Google Solar API error:", error);
    return null;
  }
}

// NREL PVWatts
async function pvWatts(geo) {
  if (!process.env.NREL_KEY) {
    console.log("⚠️ No NREL API key found, using mock data");
    return {
      annualKwh: 7500,
      roofAzimuthDeg: 180,
      roofTiltDeg: 20,
      panelCapacityKw: 5
    };
  }
  
  const key = process.env.NREL_KEY;
  const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${key}&lat=${geo.lat}&lon=${geo.lng}&system_capacity=5&azimuth=180&tilt=20`;
  
  try {
    const r = await fetch(url);
    const j = await r.json();
    const ac = j.outputs.ac_annual;
    return {
      annualKwh: ac,
      roofAzimuthDeg: 180,
      roofTiltDeg: 20,
      panelCapacityKw: 5
    };
  } catch (error) {
    console.error("NREL API error:", error);
    return {
      annualKwh: 7500,
      roofAzimuthDeg: 180,
      roofTiltDeg: 20,
      panelCapacityKw: 5
    };
  }
}

// Main function to test the full pipeline
async function testSolarAssessment(address) {
  try {
    console.log(`🔍 Starting solar assessment for: ${address}`);
    
    // 1. Geocode
    console.log("\n📍 Step 1: Geocoding address...");
    const geo = await geocode(address);
    console.log("Geocoding result:", geo);
    
    // 2. Get solar data
    console.log("\n☀️ Step 2: Getting solar potential data...");
    const solar = await getSolar(geo);
    console.log("Solar data:", solar);
    
    // 3. Mock roof image analysis (or implement actual download)
    console.log("\n🏠 Step 3: Analyzing roof image...");
    // In a real implementation, you'd download the image here
    console.log("(Mock) Downloading roof image to /tmp/roof.png");
    
    // 4. Vision analysis
    console.log("\n👁️ Step 4: Running vision analysis...");
    // Use mock data for testing
    const vision = await mockRoofVision();
    console.log("Vision analysis:", vision);
    
    // 5. Calculate best tilt and material
    console.log("\n🔧 Step 5: Determining optimal setup...");
    const bestTilt = solar.roofTiltDeg || 20;
    const bestMaterial = vision.shadePct < 20 ? "Monocrystalline" : "Half-cut PERC";
    console.log("Best tilt:", bestTilt);
    console.log("Best material:", bestMaterial);
    
    // 6. Calculate payback
    console.log("\n💰 Step 6: Calculating ROI...");
    const annualSavingsUsd = solar.annualKwh * 0.23;
    const costUsd = solar.panelCapacityKw * 1500;
    const payback = costUsd / annualSavingsUsd;
    console.log("Annual savings: $" + annualSavingsUsd.toFixed(2));
    console.log("System cost: $" + costUsd.toFixed(2));
    console.log("Payback period: " + payback.toFixed(1) + " years");
    
    // 7. Final result
    const result = {
      std: geo.std,
      lat: geo.lat,
      lng: geo.lng,
      annualKwh: solar.annualKwh,
      paybackYears: +payback.toFixed(1),
      bestTilt,
      bestMaterial,
      melissaVerified: geo.melissaVerified
    };
    
    console.log("\n✅ FINAL RESULT:");
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error("❌ Error in solar assessment:", error);
  }
}

// Run the test
const address = "134 Denslow Ave Los Angeles CA";
testSolarAssessment(address);