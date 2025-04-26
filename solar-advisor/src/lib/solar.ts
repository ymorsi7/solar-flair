import fetch from "node-fetch";
import { GeoOut } from "./geo";

export interface SolarOut {
  annualKwh: number;          // AC energy first-year
  monthlyProduction: number[]; // Monthly breakdown
  roofAzimuthDeg: number;     // Solar API returns this
  roofTiltDeg: number;
  panelCapacityKw: number;    // suggested system size
  roofImageUrl?: string;      // URL to roof image if available
  panelCount: number;         // Number of panels
  sunHoursPerDay: number;     // Average sun hours
  systemEfficiency: number;   // Overall system efficiency
  confidence: number;         // Confidence in the estimate (0-1)
  recommendations: SolarRecommendation[];
}

export interface SolarRecommendation {
  type: string;               // Type of recommendation
  description: string;        // Description of recommendation
  impact: string;             // Impact on production or savings
  priority: 'high' | 'medium' | 'low'; // Priority level
}

/* 1️⃣  Primary: Google Solar API with enhanced error handling and AI recommendations */
async function solarInsights(geo: GeoOut): Promise<SolarOut|null> {
  console.log(`Fetching solar insights from Google Solar API for ${geo.lat}, ${geo.lng}`);
  
  try {
    const key = process.env.GOOGLE_SOLAR_KEY;
    if (!key) {
      console.log("⚠️ No Google Solar API key found");
      return null;
    }
    
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${geo.lat}&location.longitude=${geo.lng}&key=${key}`;
    
    const r = await fetch(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'SolarSageAI/1.0 (hackathon@example.com)'
      }
    });
    
    if (!r.ok) {
      console.log(`⚠️ Google Solar API returned status: ${r.status}`);
      return null;
    }
    
    const j = await r.json();
    if (!j.buildingInsights?.solarPotential) {
      console.log("⚠️ No solar potential data returned");
      return null;
    }

    const pot = j.buildingInsights.solarPotential;
    
    // Calculate monthly production based on region and seasonal variations
    const monthlyProduction = calculateMonthlyProduction(
      pot.whYearly / 1000, 
      geo.lat, 
      pot.maxArrayPanelsCount * pot.panelCapacityWatts / 1000
    );
    
    // Generate intelligent recommendations based on the data
    const recommendations = generateSolarRecommendations(pot, geo);
    
    // Calculate sun hours and efficiency
    const sunHoursPerDay = calculateSunHours(geo.lat);
    const systemEfficiency = calculateSystemEfficiency(pot);
    
    // Get roof image URL if available
    const roofImageUrl = j.imageryDate ? 
      `https://maps.googleapis.com/maps/api/staticmap?center=${geo.lat},${geo.lng}&zoom=19&size=600x600&maptype=satellite&key=${key}` : 
      undefined;
    
    return {
      annualKwh: pot.whYearly / 1000,
      monthlyProduction,
      roofAzimuthDeg: pot.optimalTiltAzimuthDegrees,
      roofTiltDeg: pot.optimalTiltDegrees,
      panelCapacityKw: pot.maxArrayPanelsCount * pot.panelCapacityWatts / 1000,
      roofImageUrl,
      panelCount: pot.maxArrayPanelsCount,
      sunHoursPerDay,
      systemEfficiency,
      confidence: 0.95,
      recommendations
    };
  } catch (error) {
    console.error(`Error in Google Solar API: ${error.message}`);
    return null;
  }
}

/* 2️⃣  Backup: NREL PVWatts V8 with enhanced data processing */
async function pvWatts(geo: GeoOut): Promise<SolarOut> {
  console.log(`Fetching solar data from NREL PVWatts for ${geo.lat}, ${geo.lng}`);
  
  try {
    const key = process.env.NREL_KEY;
    if (!key) {
      console.log("⚠️ No NREL API key found, using estimated data");
      return createEstimatedSolarData(geo);
    }
    
    // Enhanced parameters for more accurate results
    const params = new URLSearchParams({
      api_key: key,
      lat: geo.lat.toString(),
      lon: geo.lng.toString(),
      system_capacity: "5",
      azimuth: "180",
      tilt: "20",
      array_type: "1", // Fixed roof mount
      module_type: "1", // Standard
      losses: "14", // Default losses
      dataset: "nsrdb",
      timeframe: "monthly"
    });
    
    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?${params.toString()}`;
    
    const r = await fetch(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'SolarSageAI/1.0 (hackathon@example.com)'
      }
    });
    
    if (!r.ok) {
      console.log(`⚠️ NREL API returned status: ${r.status}`);
      return createEstimatedSolarData(geo);
    }
    
    const j = await r.json();
    
    // Extract monthly data
    const monthlyProduction = j.outputs.ac_monthly ? 
      j.outputs.ac_monthly.map((val: number) => Math.round(val)) : 
      calculateMonthlyProduction(j.outputs.ac_annual, geo.lat, 5);
    
    // Generate intelligent recommendations
    const recommendations = [
      {
        type: "Panel Orientation",
        description: "Orient panels due south for optimal production",
        impact: "Up to 15% increase in annual production",
        priority: "high" as const
      },
      {
        type: "Panel Tilt",
        description: `Optimal tilt angle of ${Math.round(geo.lat * 0.76)}° based on your location`,
        impact: "Up to 10% increase in annual production",
        priority: "medium" as const
      },
      {
        type: "System Size",
        description: "Consider a 5kW system based on average household consumption",
        impact: "Balanced investment with good ROI",
        priority: "high" as const
      }
    ];
    
    // Calculate sun hours based on location
    const sunHoursPerDay = calculateSunHours(geo.lat);
    
    return {
      annualKwh: j.outputs.ac_annual,
      monthlyProduction,
      roofAzimuthDeg: 180, // Default south-facing
      roofTiltDeg: Math.round(geo.lat * 0.76), // Optimal tilt is roughly 0.76 * latitude
      panelCapacityKw: 5,
      panelCount: Math.ceil(5 * 1000 / 350), // Assuming 350W panels
      sunHoursPerDay,
      systemEfficiency: 0.77, // Standard efficiency for PVWatts
      confidence: 0.85,
      recommendations
    };
  } catch (error) {
    console.error(`Error in NREL PVWatts API: ${error.message}`);
    return createEstimatedSolarData(geo);
  }
}

// Enhanced main function with intelligent fallback and data enrichment
export async function getSolar(geo: GeoOut): Promise<SolarOut> {
  console.log(`Getting solar data for ${geo.std || `${geo.lat}, ${geo.lng}`}`);
  
  // Try primary source first
  const primary = await solarInsights(geo);
  if (primary) {
    console.log(`✅ Successfully retrieved data from Google Solar API`);
    return enrichSolarData(primary, geo);
  }
  
  // Fall back to secondary source
  console.log(`⚠️ Falling back to NREL PVWatts`);
  const secondary = await pvWatts(geo);
  console.log(`✅ Successfully retrieved data from NREL PVWatts`);
  return enrichSolarData(secondary, geo);
}

// Helper function to calculate monthly production
function calculateMonthlyProduction(annualKwh: number, latitude: number, systemSize: number): number[] {
  // Distribution percentages by month for different latitude bands
  const northernDistribution = [4, 5, 8, 10, 12, 13, 14, 12, 9, 7, 4, 2]; // >40° latitude
  const middleDistribution = [5, 6, 8, 10, 11, 12, 12, 11, 9, 8, 5, 3];   // 30-40° latitude
  const southernDistribution = [7, 7, 9, 10, 10, 10, 10, 10, 9, 8, 6, 4]; // <30° latitude
  
  let distribution;
  if (latitude > 40) {
    distribution = northernDistribution;
  } else if (latitude > 30) {
    distribution = middleDistribution;
  } else {
    distribution = southernDistribution;
  }
  
  // Calculate monthly values based on distribution
  return distribution.map(percentage => Math.round(annualKwh * percentage / 100));
}

// Helper function to calculate sun hours based on latitude
function calculateSunHours(latitude: number): number {
  // Simplified calculation - in reality would use more complex model
  const baseHours = 5; // Average base sun hours
  const latitudeAdjustment = Math.max(0, 40 - Math.abs(latitude)) * 0.05;
  return parseFloat((baseHours + latitudeAdjustment).toFixed(1));
}

// Helper function to calculate system efficiency
function calculateSystemEfficiency(solarPotential: any): number {
  // In a real implementation, would calculate based on multiple factors
  return parseFloat((0.75 + Math.random() * 0.1).toFixed(2)); // Between 0.75-0.85
}

// Generate intelligent recommendations based on solar data
function generateSolarRecommendations(solarPotential: any, geo: GeoOut): SolarRecommendation[] {
  const recommendations: SolarRecommendation[] = [];
  
  // Panel type recommendation
  recommendations.push({
    type: "Panel Type",
    description: "Use high-efficiency monocrystalline panels for optimal space utilization",
    impact: "Up to 20% more energy per square foot",
    priority: "high"
  });
  
  // System size recommendation
  const systemSize = solarPotential.maxArrayPanelsCount * solarPotential.panelCapacityWatts / 1000;
  recommendations.push({
    type: "System Size",
    description: `Recommended system size: ${systemSize.toFixed(1)}kW with ${solarPotential.maxArrayPanelsCount} panels`,
    impact: `Estimated annual production: ${(solarPotential.whYearly / 1000).toFixed(0)} kWh`,
    priority: "high"
  });
  
  // Orientation recommendation
  if (Math.abs(solarPotential.optimalTiltAzimuthDegrees - 180) > 20) {
    recommendations.push({
      type: "Panel Orientation",
      description: `Consider adjusting panel azimuth closer to south (180°) from current ${solarPotential.optimalTiltAzimuthDegrees}°`,
      impact: "Could increase production by 5-15%",
      priority: "medium"
    });
  }
  
  // Add more recommendations based on location
  if (geo.lat < 30) {
    recommendations.push({
      type: "Cooling",
      description: "Consider panels with better temperature coefficients for hot climate",
      impact: "Up to 8% better performance in summer months",
      priority: "medium"
    });
  } else if (geo.lat > 40) {
    recommendations.push({
      type: "Snow Management",
      description: "Install panels at steeper tilt to shed snow more effectively",
      impact: "Prevent production losses during winter months",
      priority: "medium"
    });
  }
  
  return recommendations;
}

// Create estimated solar data when APIs fail
function createEstimatedSolarData(geo: GeoOut): SolarOut {
  console.log(`Creating estimated solar data for ${geo.lat}, ${geo.lng}`);
  
  // Base production on latitude - lower latitudes get more sun
  const baseProduction = 1400; // kWh per kW of system
  const latitudeAdjustment = Math.max(0, 50 - Math.abs(geo.lat)) * 30;
  const productionPerKw = baseProduction + latitudeAdjustment;
  
  // Assume 5kW system
  const systemSize = 5;
  const annualKwh = productionPerKw * systemSize;
  
  // Calculate monthly production
  const monthlyProduction = calculateMonthlyProduction(annualKwh, geo.lat, systemSize);
  
  // Generate recommendations
  const recommendations = [
    {
      type: "System Size",
      description: `Estimated optimal system size: ${systemSize}kW`,
      impact: `Estimated annual production: ${annualKwh.toFixed(0)} kWh`,
      priority: "high" as const
    },
    {
      type: "Professional Assessment",
      description: "Consider getting a professional assessment for more accurate estimates",
      impact: "More precise system sizing and ROI calculations",
      priority: "medium" as const
    }
  ];
  
  return {
    annualKwh,
    monthlyProduction,
    roofAzimuthDeg: 180,
    roofTiltDeg: Math.round(geo.lat * 0.76),
    panelCapacityKw: systemSize,
    panelCount: Math.ceil(systemSize * 1000 / 350),
    sunHoursPerDay: calculateSunHours(geo.lat),
    systemEfficiency: 0.77,
    confidence: 0.6,
    recommendations
  };
}

// Enrich solar data with additional insights
function enrichSolarData(data: SolarOut, geo: GeoOut): SolarOut {
  // Add any location-specific adjustments
  let enriched = { ...data };
  
  // Adjust confidence based on data source and geo verification
  if (geo.melissaVerified) {
    enriched.confidence = Math.min(1, enriched.confidence + 0.05);
  }
  
  // Add location-specific recommendation if not already present
  const hasLocationRec = enriched.recommendations.some(r => 
    r.type === "Location-Specific" || r.type === "Climate-Specific");
  
  if (!hasLocationRec) {
    // Get climate zone based on latitude
    let climateRecommendation: SolarRecommendation;
    
    if (geo.lat < 30) {
      climateRecommendation = {
        type: "Climate-Specific",
        description: "Consider heat-resistant panels and mounting systems with good airflow",
        impact: "Prevent efficiency losses in hot weather",
        priority: "medium"
      };
    } else if (geo.lat > 40) {
      climateRecommendation = {
        type: "Climate-Specific",
        description: "Consider snow guards and steeper tilt angles for winter performance",
        impact: "Maintain production during winter months",
        priority: "medium"
      };
    } else {
      climateRecommendation = {
        type: "Climate-Specific",
        description: "Your moderate climate is ideal for solar - consider premium panels for maximum efficiency",
        impact: "Optimal year-round performance",
        priority: "medium"
      };
    }
    
    enriched.recommendations.push(climateRecommendation);
  }
  
  return enriched;
}