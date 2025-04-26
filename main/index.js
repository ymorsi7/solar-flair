// Main implementation file for Solar Analysis Agent

const axios = require('axios');
const googleMaps = require('@google/maps');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize API clients
const googleMapsClient = googleMaps.createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
  Promise: Promise
});

const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main handler for solar potential analysis
async function analyzeSolarPotential(params, context) {
  const { address, budget, energy_needs } = params;
  
  try {
    // Step 1: Geocode the address to get coordinates
    const coordinates = await geocodeAddress(address);
    
    // Step 2: Get satellite imagery and solar data
    const solarData = await getSolarData(coordinates);
    
    // Step 3: Get local weather and climate data
    const weatherData = await getWeatherData(coordinates);
    
    // Step 4: Calculate solar potential
    const solarPotential = calculateSolarPotential(solarData, weatherData);
    
    // Step 5: Use Gemini for advanced analysis and recommendations
    const geminiAnalysis = await getGeminiAnalysis({
      location: coordinates,
      address,
      roofData: solarData.roofData,
      weatherData,
      solarPotential,
      budget,
      energy_needs
    });
    
    // Step 6: Generate final recommendations and report
    const recommendations = generateRecommendations(geminiAnalysis, solarPotential);
    const report = generateReport(address, solarData, recommendations);
    
    return {
      status: "success",
      data: {
        recommendations,
        report,
        satellite_image_url: solarData.imageUrl,
        estimated_production: solarPotential.annualProduction,
        estimated_cost: recommendations.installationCost,
        roi: recommendations.roi
      }
    };
  } catch (error) {
    console.error("Error analyzing solar potential:", error);
    return {
      status: "error",
      error: error.message
    };
  }
}

// Get satellite imagery for an address
async function getSatelliteImage(params, context) {
  const { address } = params;
  
  try {
    const coordinates = await geocodeAddress(address);
    const imageUrl = await fetchSatelliteImage(coordinates);
    
    return {
      status: "success",
      data: {
        address,
        coordinates,
        image_url: imageUrl
      }
    };
  } catch (error) {
    console.error("Error fetching satellite image:", error);
    return {
      status: "error",
      error: error.message
    };
  }
}

// Calculate ROI for solar installation
async function calculateSolarROI(params, context) {
  const { system_size, address, installation_cost = null } = params;
  
  try {
    // Get coordinates from address
    const coordinates = await geocodeAddress(address);
    
    // Get electricity rate data for the location
    const electricityData = await getElectricityRates(coordinates);
    
    // Get weather and solar radiation data
    const weatherData = await getWeatherData(coordinates);
    
    // Calculate estimated annual production
    const annualProduction = calculateAnnualProduction(system_size, coordinates, weatherData);
    
    // Calculate annual savings
    const annualSavings = annualProduction * electricityData.rate;
    
    // Estimate installation cost if not provided
    const estimatedCost = installation_cost || estimateInstallationCost(system_size, coordinates);
    
    // Calculate ROI
    const simplePaybackYears = estimatedCost / annualSavings;
    const roi = calculateLifetimeROI(estimatedCost, annualSavings, 25); // 25 year system life
    
    return {
      status: "success",
      data: {
        system_size,
        annual_production: annualProduction,
        annual_savings: annualSavings,
        installation_cost: estimatedCost,
        simple_payback_years: simplePaybackYears,
        roi_percentage: roi,
        lifetime_savings: annualSavings * 25 - estimatedCost
      }
    };
  } catch (error) {
    console.error("Error calculating solar ROI:", error);
    return {
      status: "error",
      error: error.message
    };
  }
}

// Helper function to geocode an address
async function geocodeAddress(address) {
  try {
    const response = await googleMapsClient.geocode({
      address
    }).asPromise();
    
    if (response.json.results.length === 0) {
      throw new Error("Address not found");
    }
    
    const location = response.json.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: response.json.results[0].formatted_address
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

// Get solar data from Google Solar API
async function getSolarData(coordinates) {
  try {
    const response = await googleMapsClient.solarPotential({
      location: coordinates
    }).asPromise();
    
    // Extract and structure the solar data
    const solarData = response.json;
    
    return {
      imageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=600x600&maptype=satellite&key=${process.env.GOOGLE_MAPS_API_KEY}`,
      annualSolarRadiation: solarData.solarPotential.maxSunshineHoursPerYear,
      roofData: {
        totalArea: solarData.buildingInsights.roofSegments.reduce((total, segment) => total + segment.area, 0),
        suitableArea: solarData.buildingInsights.solarPotential.totalSuitableArea,
        segments: solarData.buildingInsights.roofSegments.map(segment => ({
          area: segment.area,
          azimuth: segment.azimuth,
          tilt: segment.tilt,
          suitability: segment.suitability
        }))
      }
    };
  } catch (error) {
    console.error("Solar data error:", error);
    throw new Error(`Failed to get solar data: ${error.message}`);
  }
}

// Get weather data for a location
async function getWeatherData(coordinates) {
  try {
    // Use the Weather DAIN Service that's already connected
    const response = await axios.get(`https://api.weather.gov/points/${coordinates.lat},${coordinates.lng}`);
    const forecastUrl = response.data.properties.forecast;
    
    const forecastResponse = await axios.get(forecastUrl);
    const weatherData = forecastResponse.data;
    
    return {
      average_temp: calculateAverageTemperature(weatherData),
      sunshine_hours: estimateSunshineHours(weatherData, coordinates),
      climate_zone: determineClimateZone(weatherData)
    };
  } catch (error) {
    console.error("Weather data error:", error);
    throw new Error(`Failed to get weather data: ${error.message}`);
  }
}

// Calculate solar potential based on roof and weather data
function calculateSolarPotential(solarData, weatherData) {
  // Calculate potential for each roof segment
  const segmentPotentials = solarData.roofData.segments.map(segment => {
    // Adjust for orientation (azimuth)
    const azimuthFactor = calculateAzimuthFactor(segment.azimuth);
    
    // Adjust for tilt
    const tiltFactor = calculateTiltFactor(segment.tilt, weatherData.sunshine_hours);
    
    // Calculate potential for this segment
    return {
      area: segment.area,
      suitability: segment.suitability,
      potentialKwh: segment.area * solarData.annualSolarRadiation * azimuthFactor * tiltFactor * 0.15 // 15% panel efficiency
    };
  });
  
  // Sum up the potential from all suitable segments
  const totalPotential = segmentPotentials
    .filter(segment => segment.suitability > 0.7) // Only use highly suitable segments
    .reduce((total, segment) => total + segment.potentialKwh, 0);
  
  // Calculate system size in kW
  const systemSizeKw = totalPotential / 1600; // Approximate annual kWh per kW of installed capacity
  
  return {
    segmentPotentials,
    annualProduction: totalPotential,
    systemSizeKw,
    panelCount: Math.floor(systemSizeKw * 1000 / 350) // Assuming 350W panels
  };
}

// Get analysis and recommendations from Gemini
async function getGeminiAnalysis(data) {
  try {
    // Prepare the prompt for Gemini
    const prompt = `
      Analyze solar panel potential for a property with the following characteristics:
      
      Location: ${data.address}
      Roof area: ${data.roofData.totalArea} sq meters
      Suitable area for panels: ${data.roofData.suitableArea} sq meters
      Climate zone: ${data.weatherData.climate_zone}
      Average temperature: ${data.weatherData.average_temp}°C
      Annual sunshine hours: ${data.weatherData.sunshine_hours}
      Potential system size: ${data.solarPotential.systemSizeKw} kW
      Estimated annual production: ${data.solarPotential.annualProduction} kWh
      
      ${data.budget ? `Budget constraint: $${data.budget}` : 'No specific budget constraints.'}
      ${data.energy_needs ? `Monthly energy needs: ${data.energy_needs} kWh` : 'No specific energy needs provided.'}
      
      Please provide recommendations for:
      1. Best solar panel material for this specific location and climate
      2. Optimal orientation and tilt angle for the panels
      3. Estimated installation costs and ROI
      4. Any special considerations for this property
    `;
    
    // Call Gemini API
    const result = await geminiAI.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    
    // Parse and structure Gemini's response
    const response = result.response.text();
    
    // Extract structured data from Gemini's response
    // This would require some parsing logic in a real implementation
    return {
      recommendedMaterial: extractMaterialRecommendation(response),
      optimalOrientation: extractOrientationRecommendation(response),
      optimalTiltAngle: extractTiltRecommendation(response),
      installationCostEstimate: extractCostEstimate(response),
      roiEstimate: extractROIEstimate(response),
      specialConsiderations: extractSpecialConsiderations(response),
      fullAnalysis: response
    };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error(`Failed to get Gemini analysis: ${error.message}`);
  }
}

// Generate final recommendations based on all data
function generateRecommendations(geminiAnalysis, solarPotential) {
  return {
    panelMaterial: geminiAnalysis.recommendedMaterial,
    orientation: geminiAnalysis.optimalOrientation,
    tiltAngle: geminiAnalysis.optimalTiltAngle,
    systemSize: solarPotential.systemSizeKw,
    panelCount: solarPotential.panelCount,
    installationCost: geminiAnalysis.installationCostEstimate,
    annualProduction: solarPotential.annualProduction,
    roi: geminiAnalysis.roiEstimate,
    specialConsiderations: geminiAnalysis.specialConsiderations
  };
}

// Generate a comprehensive report
function generateReport(address, solarData, recommendations) {
  // This would generate a structured report with all the analysis
  // In a real implementation, this might create HTML, PDF, or structured JSON
  return {
    address,
    timestamp: new Date().toISOString(),
    satelliteImageUrl: solarData.imageUrl,
    roofAnalysis: {
      totalArea: solarData.roofData.totalArea,
      suitableArea: solarData.roofData.suitableArea,
      segments: solarData.roofData.segments
    },
    solarPotential: {
      systemSize: recommendations.systemSize,
      annualProduction: recommendations.annualProduction,
      panelCount: recommendations.panelCount
    },
    recommendations: {
      panelMaterial: recommendations.panelMaterial,
      orientation: recommendations.orientation,
      tiltAngle: recommendations.tiltAngle,
      specialConsiderations: recommendations.specialConsiderations
    },
    financials: {
      estimatedCost: recommendations.installationCost,
      roi: recommendations.roi,
      paybackPeriod: recommendations.installationCost / (recommendations.annualProduction * 0.15) // Assuming $0.15/kWh
    },
    environmentalImpact: {
      co2Offset: recommendations.annualProduction * 0.7 // 0.7 kg CO2 per kWh
    }
  };
}

// Helper functions for calculations
function calculateAzimuthFactor(azimuth) {
  // South = 180 degrees (in Northern Hemisphere)
  // This is a simplified calculation
  const deviation = Math.abs(azimuth - 180);
  return Math.cos(deviation * Math.PI / 180);
}

function calculateTiltFactor(tilt, sunshineHours) {
  // Simplified calculation based on tilt
  // Optimal tilt is roughly equal to latitude
  // This is a placeholder for a more complex calculation
  return 0.9 + (tilt / 90) * 0.1;
}

function calculateAverageTemperature(weatherData) {
  // Extract and average temperature from weather data
  // Placeholder implementation
  return 15; // Example value
}

function estimateSunshineHours(weatherData, coordinates) {
  // Estimate annual sunshine hours based on location and weather data
  // Placeholder implementation
  return 2000; // Example value
}

function determineClimateZone(weatherData) {
  // Determine climate zone based on weather data
  // Placeholder implementation
  return "Temperate"; // Example value
}

function estimateInstallationCost(systemSize, coordinates) {
  // Estimate installation cost based on system size and location
  // National average is around $3 per watt
  return systemSize * 1000 * 3;
}

function calculateLifetimeROI(cost, annualSavings, years) {
  // Calculate ROI over system lifetime
  const totalSavings = annualSavings * years;
  return ((totalSavings - cost) / cost) * 100;
}

function calculateAnnualProduction(systemSize, coordinates, weatherData) {
  // Calculate estimated annual production based on system size and location
  // National average is around 1,600 kWh per kW of installed capacity
  return systemSize * 1600;
}

// Helper functions to extract structured data from Gemini's response
function extractMaterialRecommendation(response) {
  // In a real implementation, this would use NLP or regex to extract the recommendation
  // Placeholder implementation
  if (response.includes("monocrystalline")) {
    return "Monocrystalline";
  } else if (response.includes("polycrystalline")) {
    return "Polycrystalline";
  } else if (response.includes("thin-film")) {
    return "Thin-film";
  } else {
    return "Monocrystalline"; // Default
  }
}

function extractOrientationRecommendation(response) {
  // Placeholder implementation
  if (response.includes("south-facing")) {
    return "South";
  } else if (response.includes("southeast")) {
    return "Southeast";
  } else if (response.includes("southwest")) {
    return "Southwest";
  } else {
    return "South"; // Default
  }
}

function extractTiltRecommendation(response) {
  // Placeholder implementation
  // Look for numbers followed by degrees
  const match = response.match(/(\d+)°/);
  return match ? parseInt(match[1]) : 30; // Default to 30 degrees
}

function extractCostEstimate(response) {
  // Placeholder implementation
  // Look for dollar amounts
  const match = response.match(/\$(\d+,?\d*)/);
  return match ? parseFloat(match[1].replace(',', '')) : 15000; // Default
}

function extractROIEstimate(response) {
  // Placeholder implementation
  // Look for percentage
  const match = response.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 10; // Default
}

function extractSpecialConsiderations(response) {
  // Placeholder implementation
  // This would be more complex in a real implementation
  return "Consider seasonal adjustments and possible tree trimming to maximize solar exposure.";
}

// Export the handlers
module.exports = {
  analyzeSolarPotential,
  getSatelliteImage,
  calculateSolarROI
};