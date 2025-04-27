//File: example/example-node.ts

import { z } from "zod";
import axios from "axios";

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

import {
  CardUIBuilder,
  TableUIBuilder,
  MapUIBuilder,
  LayoutUIBuilder,
  ChartUIBuilder,
  ImageCardUIBuilder,
  AlertUIBuilder
} from "@dainprotocol/utils";

const port = Number(process.env.PORT) || 2022;

// Utility functions
const calculateSolarSuitabilityScore = (roofArea: number, sunExposure: number, shading: number): number => {
  // Simple algorithm to calculate suitability score out of 100
  const baseScore = (roofArea / 100) * 30 + (sunExposure / 10) * 50 - (shading * 20);
  return Math.min(Math.max(Math.round(baseScore), 0), 100);
};

const calculateAnnualProduction = (systemSize: number, suitabilityScore: number): number => {
  // Estimate annual production in kWh
  const avgEfficiency = 1200; // Average kWh per kW of installed capacity in good conditions
  return Math.round(systemSize * avgEfficiency * (suitabilityScore / 100));
};

const calculatePanelCount = (systemSize: number, panelWattage: number = 400): number => {
  // Calculate number of panels needed
  return Math.ceil((systemSize * 1000) / panelWattage);
};

const calculateOptimalTilt = (latitude: number): number => {
  // Simple approximation of optimal tilt angle based on latitude
  return Math.round(latitude * 0.76);
};

const calculateSystemCost = (systemSize: number, premiumPanels: boolean = false): number => {
  // Calculate system cost in USD
  const baseCostPerWatt = premiumPanels ? 3.0 : 2.5;
  return Math.round(systemSize * 1000 * baseCostPerWatt);
};

const calculateIncentives = (systemCost: number, location: string): number => {
  // Calculate available incentives (simplified)
  // Federal tax credit (30%)
  const federalIncentive = systemCost * 0.3;
  
  // State incentives vary by location (simplified)
  const stateIncentiveRate = 0.1; // 10% state incentive
  const stateIncentive = systemCost * stateIncentiveRate;
  
  return Math.round(federalIncentive + stateIncentive);
};

const calculateROI = (annualSavings: number, netCost: number): number => {
  // Calculate ROI as percentage
  return Math.round((annualSavings / netCost) * 100);
};

const calculatePaybackPeriod = (netCost: number, annualSavings: number): number => {
  // Calculate payback period in years
  return parseFloat((netCost / annualSavings).toFixed(1));
};

const calculateCO2Reduction = (annualProduction: number): number => {
  // Calculate CO2 reduction in kg (based on average grid emissions)
  const emissionFactor = 0.7; // kg CO2 per kWh
  return Math.round(annualProduction * emissionFactor);
};

const getWeatherEmoji = (temperature: number): string => {
  if (temperature <= 0) return "🥶";
  if (temperature <= 10) return "❄️";
  if (temperature <= 20) return "⛅";
  if (temperature <= 25) return "☀️";
  if (temperature <= 30) return "🌞";
  return "🔥";
};

// Fix the Gemini API key handling and debug the API call
const GEMINI_API_KEY = process.env.GEMINI_API || "";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_API || "";
const MAPBOX_API_KEY = process.env.MAPBOX_TOKEN || "";

// Remove the custom geocoding fallback and implement a proper dual-API approach
const geocodeAddress = async (address: string) => {
  try {
    // First attempt: Google Maps API
    const googleResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (googleResponse.data.status === "OK") {
      const location = googleResponse.data.results[0].geometry.location;
      const formattedAddress = googleResponse.data.results[0].formatted_address;
      
      console.log(`Successfully geocoded address using Google Maps API: ${location.lat}, ${location.lng}`);
      
      return {
        address: formattedAddress,
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    
    console.warn(`Google Maps Geocoding API returned status ${googleResponse.data.status}, trying Mapbox API`);
    
    // Second attempt: Mapbox API
    const mapboxResponse = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_API_KEY}`
    );
    
    if (mapboxResponse.data.features && mapboxResponse.data.features.length > 0) {
      const feature = mapboxResponse.data.features[0];
      const coordinates = feature.center; // [longitude, latitude]
      const formattedAddress = feature.place_name;
      
      console.log(`Successfully geocoded address using Mapbox API: ${coordinates[1]}, ${coordinates[0]}`);
      
      return {
        address: formattedAddress,
        latitude: coordinates[1],  // Mapbox returns [lng, lat]
        longitude: coordinates[0],
      };
    }
    
    throw new Error("Both Google Maps and Mapbox geocoding APIs failed to geocode the address");
  } catch (error) {
    console.error("Geocoding error:", error);
    
    // Last resort fallback - US center with warning
    console.warn("All geocoding APIs failed, using continental US center (very approximate)");
    return {
      address: `${address} (Geocoding Failed)`,
      latitude: 39.8283,
      longitude: -98.5795, // Center of continental US
    };
  }
};

const getWeatherConfig: ToolConfig = {
  id: "get-weather",
  name: "Get Weather",
  description: "Fetches current weather for a city",
  input: z
    .object({
      locationName: z.string().describe("Location name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    })
    .describe("Input parameters for the weather request"),
  output: z
    .object({
      temperature: z.number().describe("Current temperature in Celsius"),
      windSpeed: z.number().describe("Current wind speed in km/h"),
    })
    .describe("Current weather information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { locationName, latitude, longitude },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested weather at ${locationName} (${latitude},${longitude})`
    );

    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`
    );

    const { temperature_2m, wind_speed_10m } = response.data.current;
    const weatherEmoji = getWeatherEmoji(temperature_2m);

    return {
      text: `The current temperature in ${locationName} is ${temperature_2m}°C with wind speed of ${wind_speed_10m} km/h`,
      data: {
        temperature: temperature_2m,
        windSpeed: wind_speed_10m,
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Current Weather in ${locationName} ${weatherEmoji}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 10)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude,
                longitude,
                title: locationName,
                description: `Temperature: ${temperature_2m}°C\nWind: ${wind_speed_10m} km/h`,
                text: `${locationName} ${weatherEmoji}`,
              },
            ])
            .build()
        )
        .content(
          `Temperature: ${temperature_2m}°C\nWind Speed: ${wind_speed_10m} km/h`
        )
        .build(),
    };
  },
};

const getWeatherForecastConfig: ToolConfig = {
  id: "get-weather-forecast",
  name: "Get Weather Forecast",
  description: "Fetches hourly weather forecast",
  input: z
    .object({
      locationName: z.string().describe("Location name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    })
    .describe("Input parameters for the forecast request"),
  output: z
    .object({
      times: z.array(z.string()).describe("Forecast times"),
      temperatures: z
        .array(z.number())
        .describe("Temperature forecasts in Celsius"),
      windSpeeds: z.array(z.number()).describe("Wind speed forecasts in km/h"),
      humidity: z
        .array(z.number())
        .describe("Relative humidity forecasts in %"),
    })
    .describe("Hourly weather forecast"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { locationName, latitude, longitude },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested forecast at ${locationName} (${latitude},${longitude})`
    );

    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
    );

    const { time, temperature_2m, wind_speed_10m, relative_humidity_2m } =
      response.data.hourly;

    // Limit to first 24 hours of forecast data
    const limitedTime = time.slice(0, 24);
    const limitedTemp = temperature_2m.slice(0, 24);
    const limitedWind = wind_speed_10m.slice(0, 24);
    const limitedHumidity = relative_humidity_2m.slice(0, 24);

    const weatherEmoji = getWeatherEmoji(limitedTemp[0]);

    return {
      text: `Weather forecast for ${locationName} available for the next 24 hours`,
      data: {
        times: limitedTime,
        temperatures: limitedTemp,
        windSpeeds: limitedWind,
        humidity: limitedHumidity,
      },
      ui: new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 10)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude,
                longitude,
                title: locationName,
                description: `Temperature: ${limitedTemp[0]}°C\nWind: ${limitedWind[0]} km/h`,
                text: `${locationName} ${weatherEmoji}`,
              },
            ])
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "time", header: "Time", type: "string" },
              {
                key: "temperature",
                header: "Temperature (°C)",
                type: "number",
              },
              { key: "windSpeed", header: "Wind Speed (km/h)", type: "number" },
              { key: "humidity", header: "Humidity (%)", type: "number" },
            ])
            .rows(
              limitedTime.map((t: string, i: number) => ({
                time: new Date(t).toLocaleString(),
                temperature: limitedTemp[i],
                windSpeed: limitedWind[i],
                humidity: limitedHumidity[i],
              }))
            )
            .build()
        )
        .build(),
    };
  },
};

// Fix the analyzePropertyWithGemini function to be more explicit and handle arrays
const analyzePropertyWithGemini = async (address: string, latitude: number, longitude: number) => {
  try {
    console.log(`Analyzing property with Gemini API: ${address} (${latitude}, ${longitude})`);
    
    // Use the gemini-1.5-flash model
    const modelName = "gemini-1.5-flash";
    
    // Create a more explicit prompt for property analysis
    const prompt = `Analyze the rooftop solar potential for a property at ${address} (coordinates: ${latitude}, ${longitude}).
    
    IMPORTANT: Provide the following data points as SINGLE VALUES (not arrays) with no explanations:
    1. Roof area in square feet (only for the specific address, not neighboring houses)
    2. Solar suitability score from 0-100
    3. Average daily sun exposure in hours
    4. Roof type (e.g., Composite Shingle, Metal, Tile)
    5. Roof slope in degrees
    6. Percentage of shading
    
    Format your response as JSON like this:
    {
      "roofArea": 1800,  // a single number, not an array
      "suitabilityScore": 85,  // a single number, not an array
      "sunExposure": 6.5,  // a single number, not an array
      "roofType": "Composite Shingle",  // a single string, not an array
      "roofSlope": 22,  // a single number, not an array
      "shadingFactor": 15  // a single number, not an array
    }
    
    DO NOT use arrays for any values. Each property must be a single value of the correct type.
    Base your analysis on any geospatial data you can access for this specific address.`;
    
    console.log(`Gemini API URL: https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY.substring(0, 3)}...`);
    
    // Call Gemini API for analysis
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Gemini API response status:", response.status);
    
    // Extract text response from Gemini
    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content.parts[0].text) {
      console.error("Unexpected Gemini API response format:", JSON.stringify(response.data));
      throw new Error("Unexpected Gemini API response format");
    }
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log("Gemini raw response:", responseText);
    
    // Extract the JSON part from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from Gemini response:", responseText);
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    // Parse JSON data
    const rawData = JSON.parse(jsonMatch[0]);
    console.log("Successfully parsed Gemini response:", rawData);
    
    // Process the data, handling cases where values might be arrays or incorrect types
    const extractValue = (value: any, defaultValue: any) => {
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : defaultValue;
      }
      return value !== undefined ? value : defaultValue;
    };
    
    const analysisData = {
      roofArea: Number(extractValue(rawData.roofArea, 1800)),
      suitabilityScore: Number(extractValue(rawData.suitabilityScore, 75)),
      sunExposure: Number(extractValue(rawData.sunExposure, 6.5)),
      shadingFactor: Number(extractValue(rawData.shadingFactor, 15)),
      roofType: String(extractValue(rawData.roofType, "Composite Shingle")),
      roofSlope: Number(extractValue(rawData.roofSlope, 22))
    };
    
    console.log("Successfully processed property analysis from Gemini:", analysisData);
    
    return {
      roofArea: analysisData.roofArea,
      suitabilityScore: analysisData.suitabilityScore,
      sunExposure: analysisData.sunExposure / 24 * 10, // Convert hours to 0-10 scale
      shadingFactor: analysisData.shadingFactor,
      roofType: analysisData.roofType,
      roofSlope: analysisData.roofSlope
    };
  } catch (error) {
    console.error("Error analyzing property with Gemini:", error);
    if (error.response) {
      console.error("Gemini API error response:", JSON.stringify(error.response.data));
    }
    
    console.warn("FALLING BACK to NREL solar data API instead of simulated data");
    
    try {
      // Try to use NREL PVWatts API as a backup for solar data
      console.log(`Trying NREL PVWatts API with coordinates: ${latitude}, ${longitude}`);
      const nrelResponse = await axios.get(
        `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=DEMO_KEY&lat=${latitude}&lon=${longitude}&system_capacity=4&azimuth=180&tilt=20&array_type=1&module_type=1&losses=14`
      );
      
      if (nrelResponse.data.outputs) {
        console.log("Successfully got NREL data:", nrelResponse.data.outputs);
        const pvData = nrelResponse.data;
        const outputs = pvData.outputs;
        
        // Convert NREL data to our required format
        return {
          roofArea: Math.round(pvData.inputs.system_capacity * 450), // ~450 sq ft per kW for residential
          suitabilityScore: Math.min(Math.max(Math.round((outputs.ac_annual / 6000) * 80 + 10), 30), 95), // Scale based on output
          sunExposure: Math.min(Math.max(outputs.solrad_annual / 365 * 10, 5), 9.5), // Based on solar radiation
          shadingFactor: Math.round(pvData.inputs.losses / 2), // Rough estimate from system losses
          roofType: "Composite Shingle", // Most common in US
          roofSlope: Math.round(pvData.inputs.tilt) // Use tilt as slope
        };
      }
      
      throw new Error("NREL API did not return expected data");
    } catch (nrelError) {
      console.error("NREL API error:", nrelError);
      throw new Error("All APIs failed. Cannot provide property analysis without external data sources.");
    }
  }
};

// Update the analyzePropertyConfig handler to use Gemini API
const analyzePropertyConfig: ToolConfig = {
  id: "analyze-property",
  name: "Analyze Property",
  description: "Analyzes a property address to determine solar potential and roof characteristics",
  input: z
    .object({
      address: z.string().describe("Full property address"),
      propertyType: z.enum(["residential", "commercial", "industrial"]).optional()
        .describe("Type of property (default: residential)"),
    })
    .describe("Property information for solar analysis"),
  output: z
    .object({
      address: z.string().describe("Verified property address"),
      latitude: z.number().describe("Property latitude"),
      longitude: z.number().describe("Property longitude"),
      roofArea: z.number().describe("Available roof area in square feet"),
      suitabilityScore: z.number().describe("Solar suitability score (0-100)"),
      sunExposure: z.number().describe("Annual sun exposure rating (0-10)"),
      shadingFactor: z.number().describe("Shading factor percentage (0-100)"),
      roofType: z.string().describe("Type of roof"),
      roofSlope: z.number().describe("Roof slope in degrees"),
      optimalTiltAngle: z.number().describe("Optimal panel tilt angle in degrees"),
    })
    .describe("Solar suitability analysis results"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ address, propertyType = "residential" }, agentInfo, context) => {
    console.log(`User / Agent ${agentInfo.id} requested solar analysis for ${address}`);
    
    try {
      // Use geocode service
      const geocodeResult = await geocodeAddress(address);
      
      console.log(`Geocoded ${address} to coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
      
      // Use Gemini to analyze roof characteristics
      const roofAnalysis = await analyzePropertyWithGemini(
        geocodeResult.address,
        geocodeResult.latitude,
        geocodeResult.longitude
      );
      
      // Calculate optimal tilt angle
      const optimalTiltAngle = calculateOptimalTilt(geocodeResult.latitude);
      
      // Create response object
      const analysisResult = {
        address: geocodeResult.address,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        roofArea: roofAnalysis.roofArea,
        suitabilityScore: roofAnalysis.suitabilityScore,
        sunExposure: roofAnalysis.sunExposure,
        shadingFactor: roofAnalysis.shadingFactor,
        roofType: roofAnalysis.roofType,
        roofSlope: roofAnalysis.roofSlope,
        optimalTiltAngle: optimalTiltAngle,
      };

      // Create UI component with Mapbox
      const propertyCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Solar Analysis for ${geocodeResult.address}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: `Suitability: ${roofAnalysis.suitabilityScore}/100`,
                text: `${roofAnalysis.suitabilityScore}/100`,
              },
            ])
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "property", header: "Property Detail", type: "string" },
              { key: "value", header: "Value", type: "string" },
            ])
            .rows([
              { property: "Solar Suitability Score", value: `${roofAnalysis.suitabilityScore}/100` },
              { property: "Roof Area", value: `${roofAnalysis.roofArea} sq ft` },
              { property: "Roof Type", value: roofAnalysis.roofType },
              { property: "Roof Slope", value: `${roofAnalysis.roofSlope}°` },
              { property: "Sun Exposure", value: `${roofAnalysis.sunExposure}/10` },
              { property: "Shading", value: `${roofAnalysis.shadingFactor}%` },
              { property: "Optimal Panel Tilt", value: `${optimalTiltAngle}°` },
            ])
            .build()
        )
        .build();

      return {
        text: `Property at ${geocodeResult.address} has a solar suitability score of ${roofAnalysis.suitabilityScore}/100 with ${roofAnalysis.roofArea} sq ft of usable roof area.`,
        data: analysisResult,
        ui: propertyCard,
      };
    } catch (error) {
      console.error(`Error analyzing property:`, error);
      
      // Create fallback data with US coordinates
      const geocodeResult = {
        address: `${address} (Geocoding Failed)`,
        latitude: 39.8283,
        longitude: -98.5795, // Center of continental US
      };
      
      // Use simulated data for analysis
      const roofAnalysis = {
        roofArea: 1800,
        suitabilityScore: 75,
        sunExposure: 8.5,
        shadingFactor: 15,
        roofType: "Composite Shingle",
        roofSlope: 22,
      };
      
      const optimalTiltAngle = calculateOptimalTilt(geocodeResult.latitude);
      
      // Create fallback response object
      const analysisResult = {
        address: geocodeResult.address,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        roofArea: roofAnalysis.roofArea,
        suitabilityScore: roofAnalysis.suitabilityScore,
        sunExposure: roofAnalysis.sunExposure,
        shadingFactor: roofAnalysis.shadingFactor,
        roofType: roofAnalysis.roofType,
        roofSlope: roofAnalysis.roofSlope,
        optimalTiltAngle: optimalTiltAngle,
      };
      
      // Create error UI with Mapbox instead of Google Maps
      const errorCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Solar Analysis for ${geocodeResult.address}`)
        .addChild(
          new AlertUIBuilder()
            .variant("warning")
            .title("Note: Using Simulated Data")
            .message(`Unable to analyze the exact property at ${address}. Showing estimated solar potential based on regional averages.`)
            .build()
        )
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: `Suitability: ${roofAnalysis.suitabilityScore}/100`,
                text: `${roofAnalysis.suitabilityScore}/100`,
              },
            ])
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "property", header: "Property Detail", type: "string" },
              { key: "value", header: "Value", type: "string" },
            ])
            .rows([
              { property: "Solar Suitability Score", value: `${roofAnalysis.suitabilityScore}/100` },
              { property: "Roof Area", value: `${roofAnalysis.roofArea} sq ft` },
              { property: "Roof Type", value: roofAnalysis.roofType },
              { property: "Roof Slope", value: `${roofAnalysis.roofSlope}°` },
              { property: "Sun Exposure", value: `${roofAnalysis.sunExposure}/10` },
              { property: "Shading", value: `${roofAnalysis.shadingFactor}%` },
              { property: "Optimal Panel Tilt", value: `${optimalTiltAngle}°` },
            ])
            .build()
        )
        .build();
      
      return {
        text: `Property at ${geocodeResult.address} has an estimated solar suitability score of ${roofAnalysis.suitabilityScore}/100 with approximately ${roofAnalysis.roofArea} sq ft of usable roof area. Note: This is simulated data.`,
        data: analysisResult,
        ui: errorCard,
      };
    }
  },
};

// Fix the getSystemRecommendationWithGemini function to handle array responses
const getSystemRecommendationWithGemini = async (
  roofArea: number,
  suitabilityScore: number,
  monthlyUsage: number,
  location: string,
  roofType: string,
  roofSlope: number,
  preferHighEfficiency: boolean,
  batteryStorage: boolean
) => {
  try {
    console.log(`Requesting system recommendation from Gemini for ${location}`);
    
    // Use the gemini-1.5-flash model
    const modelName = "gemini-1.5-flash";
    
    // Create a prompt that asks for specific system recommendation with EXPLICIT instructions
    const prompt = `Recommend an optimal solar panel system configuration based on the following property details:

          Property details:
          - Roof area: ${roofArea} square feet
          - Solar suitability score: ${suitabilityScore}/100
          - Average monthly electricity usage: ${monthlyUsage} kWh
          
          - Location: ${location}
          - Roof type: ${roofType}
          - Roof slope: ${roofSlope} degrees
          
          User preferences:
          - Preference for high-efficiency panels: ${preferHighEfficiency ? 'Yes' : 'No'}
          - Include battery storage: ${batteryStorage ? 'Yes' : 'No'}
          
          IMPORTANT: Return your recommendation in a specific JSON format where each field must be a SINGLE value, not an array:
          {
            "recommendedSystemSize": 7.5,  // a single number in kW, not an array
            "panelType": "Standard Monocrystalline",  // a single string, not an array
            "panelCount": 22,  // a single integer, not an array
            "panelWattage": 400,  // a single integer in watts, not an array
            "panelEfficiency": 20,  // a single number as percentage, not an array
            "annualProduction": 10500,  // a single integer in kWh, not an array
            "installationType": "Fixed Roof Mount",  // a single string, not an array
            "includeBattery": false,  // a single boolean (true/false), not an array
            "batteryCapacity": 13.5  // a single number in kWh (if includeBattery is true), not an array
          }
          
          DO NOT use arrays for any values. Each property must be a single value of the correct type.
          Use real-world solar industry standards and best practices for your recommendation.`;
    
    console.log(`Gemini API URL: https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY.substring(0, 3)}...`);
    
    // Call Gemini API for system recommendation
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Gemini API response status:", response.status);
    
    // Extract text response from Gemini
    if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content.parts[0].text) {
      console.error("Unexpected Gemini API response format:", JSON.stringify(response.data));
      throw new Error("Unexpected Gemini API response format");
    }
    
    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log("Gemini raw response:", responseText);
    
    // Extract the JSON part from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from Gemini response:", responseText);
      throw new Error("Could not parse JSON from Gemini response");
    }
    
    // Parse JSON data
    const rawData = JSON.parse(jsonMatch[0]);
    console.log("Parsed Gemini response:", rawData);
    
    // Process the data, handling cases where values might be arrays or incorrect types
    const extractValue = (value: any, defaultValue: any) => {
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : defaultValue;
      }
      return value !== undefined ? value : defaultValue;
    };
    
    const recommendationData = {
      recommendedSystemSize: Number(extractValue(rawData.recommendedSystemSize, 7.5)),
      panelType: String(extractValue(rawData.panelType, "Standard Monocrystalline")),
      panelCount: Number(extractValue(rawData.panelCount, 20)),
      panelWattage: Number(extractValue(rawData.panelWattage, 400)),
      panelEfficiency: Number(extractValue(rawData.panelEfficiency, 20)),
      annualProduction: Number(extractValue(rawData.annualProduction, 9000)),
      installationType: String(extractValue(rawData.installationType, "Fixed Roof Mount")),
      includeBattery: Boolean(extractValue(rawData.includeBattery, batteryStorage)),
      batteryCapacity: batteryStorage ? Number(extractValue(rawData.batteryCapacity, 13.5)) : undefined
    };
    
    console.log("Successfully processed system recommendation from Gemini:", recommendationData);
    
    return recommendationData;
  } catch (error) {
    console.error("Error getting recommendation from Gemini:", error);
    throw new Error("Failed to get recommendation from Gemini: " + error.message);
  }
};

// Update the recommendSolarSystemConfig handler to use Gemini
const recommendSolarSystemConfig: ToolConfig = {
  id: "recommend-solar-system",
  name: "Recommend Solar System",
  description: "Recommends optimal solar panel system configuration based on property analysis",
  input: z
    .object({
      roofArea: z.number().describe("Available roof area in square feet"),
      suitabilityScore: z.number().describe("Solar suitability score (0-100)"),
      monthlyUsage: z.number().optional().describe("Average monthly electricity usage in kWh"),
      budgetConstraint: z.number().optional().describe("Maximum budget in USD"),
      preferHighEfficiency: z.boolean().optional().describe("Preference for high-efficiency panels"),
      batteryStorage: z.boolean().optional().describe("Include battery storage"),
      location: z.string().optional().describe("Property location")
    })
    .describe("Property and preference details for system recommendation"),
  output: z
    .object({
      recommendedSystemSize: z.number().describe("Recommended system size in kW"),
      panelType: z.string().describe("Recommended solar panel type"),
      panelCount: z.number().describe("Number of solar panels"),
      panelWattage: z.number().describe("Individual panel wattage in watts"),
      panelEfficiency: z.number().describe("Panel efficiency percentage"),
      annualProduction: z.number().describe("Estimated annual energy production in kWh"),
      installationType: z.string().describe("Type of mounting system recommended"),
      includeBattery: z.boolean().describe("Whether battery storage is included"),
      batteryCapacity: z.number().optional().describe("Battery capacity in kWh"),
    })
    .describe("Solar system recommendation details"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { 
      roofArea, 
      suitabilityScore, 
      monthlyUsage = 900, 
      budgetConstraint, 
      preferHighEfficiency = false, 
      batteryStorage = false,
      location = "California"
    },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested solar system recommendation`
    );

    try {
      // Use Gemini to get system recommendation
      const recommendation = await getSystemRecommendationWithGemini(
        roofArea,
        suitabilityScore,
        monthlyUsage,
        location,
        "Standard", // Default roof type if not provided
        20, // Default roof slope if not provided
        preferHighEfficiency,
        batteryStorage
      );

      // Create UI components
      const systemCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Recommended Solar System`)
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "detail", header: "System Detail", type: "string" },
              { key: "value", header: "Value", type: "string" },
            ])
            .rows([
              { detail: "System Size", value: `${recommendation.recommendedSystemSize} kW` },
              { detail: "Panel Type", value: recommendation.panelType },
              { detail: "Panel Count", value: `${recommendation.panelCount}` },
              { detail: "Panel Wattage", value: `${recommendation.panelWattage} W` },
              { detail: "Panel Efficiency", value: `${recommendation.panelEfficiency}%` },
              { detail: "Annual Production", value: `${recommendation.annualProduction.toLocaleString()} kWh` },
              { detail: "Installation Type", value: recommendation.installationType },
              { detail: "Battery Storage", value: recommendation.includeBattery ? 
                `Yes (${recommendation.batteryCapacity} kWh)` : "No" },
            ])
            .build()
        )
        .addChild(
          new ChartUIBuilder()
            .type("bar")
            .title("Projected Monthly Production")
            .chartData([
              { month: "Jan", production: Math.round(recommendation.annualProduction * 0.06) },
              { month: "Feb", production: Math.round(recommendation.annualProduction * 0.07) },
              { month: "Mar", production: Math.round(recommendation.annualProduction * 0.08) },
              { month: "Apr", production: Math.round(recommendation.annualProduction * 0.09) },
              { month: "May", production: Math.round(recommendation.annualProduction * 0.11) },
              { month: "Jun", production: Math.round(recommendation.annualProduction * 0.12) },
              { month: "Jul", production: Math.round(recommendation.annualProduction * 0.12) },
              { month: "Aug", production: Math.round(recommendation.annualProduction * 0.11) },
              { month: "Sep", production: Math.round(recommendation.annualProduction * 0.09) },
              { month: "Oct", production: Math.round(recommendation.annualProduction * 0.07) },
              { month: "Nov", production: Math.round(recommendation.annualProduction * 0.05) },
              { month: "Dec", production: Math.round(recommendation.annualProduction * 0.03) },
            ])
            .dataKeys({ x: "month", y: "production" })
            .build()
        )
        .content(`Based on your roof area of ${roofArea} sq ft and electricity usage of ${monthlyUsage} kWh/month, we recommend a ${recommendation.recommendedSystemSize} kW system with ${recommendation.panelCount} panels.`)
        .build();

      return {
        text: `Recommended a ${recommendation.recommendedSystemSize} kW solar system with ${recommendation.panelCount} ${recommendation.panelType} panels, producing approximately ${recommendation.annualProduction.toLocaleString()} kWh annually.`,
        data: recommendation,
        ui: systemCard,
      };
    } catch (error) {
      console.error(`Error generating system recommendation:`, error);
      
      // Fall back to NREL's PVWatts API if Gemini fails
      try {
        console.log("Falling back to NREL PVWatts API for system recommendation");
        
        // Approximate location (we would need geocoding for exact, but this is just a fallback)
        const lat = 36.7783; // Default to California
        const lon = -119.4179;
        
        // Calculate system size based on monthly usage and roof area
        const yearlyUsage = monthlyUsage * 12;
        const estimatedProduction = yearlyUsage * 1.1; // 10% buffer
        const sizeByUsage = estimatedProduction / 1400; // Average production per kW
        
        // Constrain by roof area (approx 100 sq ft per kW)
        const maxSizeByRoofArea = (roofArea / 100);
        let recommendedSystemSize = Math.min(maxSizeByRoofArea, sizeByUsage);
        recommendedSystemSize = Math.round(recommendedSystemSize * 2) / 2; // Round to nearest 0.5 kW
        
        // Set panel details based on preference
        const panelWattage = preferHighEfficiency ? 450 : 400;
        const panelEfficiency = preferHighEfficiency ? 22.5 : 20;
        const panelCount = Math.ceil((recommendedSystemSize * 1000) / panelWattage);
        
        // Use NREL API to estimate production
        const nrelResponse = await axios.get(
          `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=DEMO_KEY&lat=${lat}&lon=${lon}&system_capacity=${recommendedSystemSize}&azimuth=180&tilt=20&array_type=1&module_type=1&losses=14`
        );
        
        if (nrelResponse.data.outputs) {
          const outputs = nrelResponse.data.outputs;
          const annualProduction = Math.round(outputs.ac_annual);
          
          const recommendation = {
            recommendedSystemSize,
            panelType: preferHighEfficiency ? "High-Efficiency Monocrystalline" : "Standard Monocrystalline",
            panelCount,
            panelWattage,
            panelEfficiency,
            annualProduction,
            installationType: "Fixed Roof Mount",
            includeBattery: batteryStorage,
            batteryCapacity: batteryStorage ? 13.5 : undefined,
          };
          
          // Create UI components with fallback note
          const systemCard = new CardUIBuilder()
            .setRenderMode("page")
            .title(`Recommended Solar System`)
            .addChild(
              new AlertUIBuilder()
                .variant("info")
                .title("Note: Using NREL Data")
                .message("This recommendation is based on NREL's PVWatts calculator since Gemini's data was unavailable.")
                .build()
            )
            .addChild(
              new TableUIBuilder()
                .addColumns([
                  { key: "detail", header: "System Detail", type: "string" },
                  { key: "value", header: "Value", type: "string" },
                ])
                .rows([
                  { detail: "System Size", value: `${recommendation.recommendedSystemSize} kW` },
                  { detail: "Panel Type", value: recommendation.panelType },
                  { detail: "Panel Count", value: `${recommendation.panelCount}` },
                  { detail: "Panel Wattage", value: `${recommendation.panelWattage} W` },
                  { detail: "Panel Efficiency", value: `${recommendation.panelEfficiency}%` },
                  { detail: "Annual Production", value: `${recommendation.annualProduction.toLocaleString()} kWh` },
                  { detail: "Installation Type", value: recommendation.installationType },
                  { detail: "Battery Storage", value: recommendation.includeBattery ? 
                    `Yes (${recommendation.batteryCapacity} kWh)` : "No" },
                ])
                .build()
            )
            .addChild(
              new ChartUIBuilder()
                .type("bar")
                .title("Projected Monthly Production")
                .chartData([
                  { month: "Jan", production: Math.round(recommendation.annualProduction * 0.06) },
                  { month: "Feb", production: Math.round(recommendation.annualProduction * 0.07) },
                  { month: "Mar", production: Math.round(recommendation.annualProduction * 0.08) },
                  { month: "Apr", production: Math.round(recommendation.annualProduction * 0.09) },
                  { month: "May", production: Math.round(recommendation.annualProduction * 0.11) },
                  { month: "Jun", production: Math.round(recommendation.annualProduction * 0.12) },
                  { month: "Jul", production: Math.round(recommendation.annualProduction * 0.12) },
                  { month: "Aug", production: Math.round(recommendation.annualProduction * 0.11) },
                  { month: "Sep", production: Math.round(recommendation.annualProduction * 0.09) },
                  { month: "Oct", production: Math.round(recommendation.annualProduction * 0.07) },
                  { month: "Nov", production: Math.round(recommendation.annualProduction * 0.05) },
                  { month: "Dec", production: Math.round(recommendation.annualProduction * 0.03) },
                ])
                .dataKeys({ x: "month", y: "production" })
                .build()
            )
            .content(`Based on your roof area of ${roofArea} sq ft and electricity usage of ${monthlyUsage} kWh/month, we recommend a ${recommendation.recommendedSystemSize} kW system with ${recommendation.panelCount} panels.`)
            .build();

          return {
            text: `Recommended a ${recommendation.recommendedSystemSize} kW solar system with ${recommendation.panelCount} ${recommendation.panelType} panels, producing approximately ${recommendation.annualProduction.toLocaleString()} kWh annually. (Based on NREL data)`,
            data: recommendation,
            ui: systemCard,
          };
        }
        
        throw new Error("NREL API did not return expected data");
      } catch (fallbackError) {
        console.error("Fallback recommendation also failed:", fallbackError);
        
        return {
          text: `Error generating system recommendation: ${error.message}.`,
          data: { error: error.message },
          ui: new AlertUIBuilder()
            .variant("error")
            .title("System Recommendation Failed")
            .message("Unable to generate solar system recommendation. Please check your inputs and try again.")
            .build(),
        };
      }
    }
  },
};

const calculateFinancialsConfig: ToolConfig = {
  id: "calculate-financials",
  name: "Calculate Solar Financials",
  description: "Calculates financial metrics for a proposed solar system including costs, savings, and ROI",
  suggestConfirmation: true,
  async suggestConfirmationUI(input) {
    return {
      success: true,
      ui: new CardUIBuilder()
        .title('Confirm Financial Analysis')
        .content(`
          ## Solar System Details
          
          **System Size:** ${input.systemSize} kW
          **Panel Type:** ${input.panelType || "Standard"}
          **Annual Production:** ${input.annualProduction?.toLocaleString() || "Unknown"} kWh
          **Location:** ${input.location || "Unknown"}
        `)
        .build()
    };
  },
  input: z
    .object({
      systemSize: z.number().describe("System size in kW"),
      annualProduction: z.number().describe("Estimated annual energy production in kWh"),
      location: z.string().describe("Property location (for incentive calculation)"),
      electricityRate: z.number().optional().describe("Current electricity rate in $/kWh"),
      panelType: z.string().optional().describe("Type of solar panels"),
      includeBattery: z.boolean().optional().describe("Whether battery storage is included"),
      financingOption: z.enum(["cash", "loan", "lease"]).optional().describe("Financing option"),
      loanTerm: z.number().optional().describe("Loan term in years"),
      loanInterestRate: z.number().optional().describe("Loan interest rate percentage"),
    })
    .describe("System and financial parameters"),
  output: z
    .object({
      systemCost: z.number().describe("Total system cost before incentives"),
      incentives: z.number().describe("Total incentives and tax credits"),
      netCost: z.number().describe("Net cost after incentives"),
      annualSavings: z.number().describe("Annual electricity bill savings"),
      paybackPeriod: z.number().describe("Payback period in years"),
      roi: z.number().describe("Return on investment percentage"),
      twentyYearSavings: z.number().describe("20-year electricity bill savings"),
      financingDetails: z.object({
        option: z.string().describe("Financing option selected"),
        monthlyPayment: z.number().optional().describe("Monthly payment amount"),
        termYears: z.number().optional().describe("Term length in years"),
      }).describe("Financing details"),
    })
    .describe("Financial analysis results"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { 
      systemSize, 
      annualProduction, 
      location, 
      electricityRate = 0.15, 
      panelType = "Standard Monocrystalline", 
      includeBattery = false,
      financingOption = "cash",
      loanTerm = 10,
      loanInterestRate = 5.0
    },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested financial analysis for ${systemSize}kW system`
    );

    try {
      // Calculate system cost
      const isPremium = panelType.toLowerCase().includes("high-efficiency");
      const systemCost = calculateSystemCost(systemSize, isPremium);
      
      // Add battery cost if included
      const batteryCost = includeBattery ? 10000 : 0;
      const totalSystemCost = systemCost + batteryCost;
      
      // Calculate incentives
      const incentives = calculateIncentives(totalSystemCost, location);
      
      // Calculate net cost
      const netCost = totalSystemCost - incentives;
      
      // Calculate annual savings
      const annualSavings = annualProduction * electricityRate;
      
      // Calculate payback period
      const paybackPeriod = calculatePaybackPeriod(netCost, annualSavings);
      
      // Calculate ROI
      const roi = calculateROI(annualSavings, netCost);
      
      // Calculate 20-year savings
      const annualDegradation = 0.005; // 0.5% panel degradation per year
      let twentyYearSavings = 0;
      for (let year = 0; year < 20; year++) {
        const yearProduction = annualProduction * Math.pow(1 - annualDegradation, year);
        // Assume 3% annual electricity price inflation
        const yearRate = electricityRate * Math.pow(1.03, year);
        twentyYearSavings += yearProduction * yearRate;
      }
      
      // Calculate financing details
      let monthlyPayment = undefined;
      if (financingOption === "loan") {
        const monthlyRate = loanInterestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        monthlyPayment = netCost * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
      }
      
      // Create financial analysis object
      const financialAnalysis = {
        systemCost: totalSystemCost,
        incentives,
        netCost,
        annualSavings,
        paybackPeriod,
        roi,
        twentyYearSavings: Math.round(twentyYearSavings),
        financingDetails: {
          option: financingOption,
          monthlyPayment: financingOption === "loan" ? Math.round(monthlyPayment) : undefined,
          termYears: financingOption === "loan" ? loanTerm : undefined,
        },
      };

      // Create UI components
      const financialCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Solar Financial Analysis`)
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "item", header: "Financial Item", type: "string" },
              { key: "value", header: "Value", type: "string" },
            ])
            .rows([
              { item: "System Cost", value: `$${totalSystemCost.toLocaleString()}` },
              { item: "Incentives & Rebates", value: `$${incentives.toLocaleString()}` },
              { item: "Net Cost", value: `$${netCost.toLocaleString()}` },
              { item: "Annual Savings", value: `$${annualSavings.toLocaleString()}` },
              { item: "Payback Period", value: `${paybackPeriod} years` },
              { item: "ROI", value: `${roi}%` },
              { item: "20-Year Savings", value: `$${financialAnalysis.twentyYearSavings.toLocaleString()}` },
              financingOption === "loan" ? 
                { item: "Monthly Loan Payment", value: `$${financialAnalysis.financingDetails.monthlyPayment}` } : 
                { item: "Financing Option", value: financingOption }
            ])
            .build()
        )
        .addChild(
          new ChartUIBuilder()
            .type("line")
            .title("Cumulative Savings Over Time")
            .chartData(Array(25).fill(0).map((_, year) => {
              let cumulative = -netCost;
              for (let y = 0; y <= year; y++) {
                const yearProduction = annualProduction * Math.pow(1 - annualDegradation, y);
                const yearRate = electricityRate * Math.pow(1.03, y);
                cumulative += yearProduction * yearRate;
              }
              return {
                year: year,
                savings: Math.round(cumulative)
              };
            }))
            .dataKeys({ x: "year", y: "savings" })
            .build()
        )
        .content(`A ${systemSize}kW solar system will cost approximately $${netCost.toLocaleString()} after incentives, saving $${annualSavings.toLocaleString()} annually with a payback period of ${paybackPeriod} years. 20-year savings estimated at $${financialAnalysis.twentyYearSavings.toLocaleString()}.`)
        .build();

      return {
        text: `Financial analysis shows a net cost of $${netCost.toLocaleString()} with $${annualSavings.toLocaleString()} annual savings and ${paybackPeriod} year payback period. 20-year savings estimated at $${financialAnalysis.twentyYearSavings.toLocaleString()}.`,
        data: financialAnalysis,
        ui: financialCard,
      };
    } catch (error) {
      console.error(`Error generating financial analysis:`, error);
      
      return {
        text: `Error generating financial analysis: ${error.message}.`,
        data: { error: error.message },
        ui: new AlertUIBuilder()
          .variant("error")
          .title("Financial Analysis Failed")
          .message("Unable to calculate financial metrics. Please check your inputs and try again.")
          .build(),
      };
    }
  },
};

// Update the generatePropertyImageConfig handler to remove direct static images
const generatePropertyImageConfig: ToolConfig = {
  id: "generate-property-image",
  name: "Generate Property Image",
  description: "Generates a satellite image of a property",
  input: z
    .object({
      address: z.string().describe("Property address"),
    })
    .describe("Property address information"),
  output: z
    .object({
      latitude: z.number().describe("Property latitude"),
      longitude: z.number().describe("Property longitude"),
      address: z.string().describe("Formatted address")
    })
    .describe("Property location information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ address }, agentInfo, context) => {
    console.log(`User / Agent ${agentInfo.id} requested property image for ${address}`);
    
    try {
      // Use geocode service
      const geocodeResult = await geocodeAddress(address);
      
      // Create response object with location data
      const imageResult = {
        address: geocodeResult.address,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
      };

      // Create UI component with enhanced map (no direct static image)
      const imageCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Property Location: ${geocodeResult.address}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: `Location: ${geocodeResult.address}`,
                text: "📍",
              },
            ])
            .build()
        )
        .content(`Interactive satellite view of ${geocodeResult.address}. Use the map controls to zoom and pan.`)
        .build();

      return {
        text: `Generated property location view for ${geocodeResult.address}`,
        data: imageResult,
        ui: imageCard,
      };
    } catch (error) {
      console.error(`Error generating property image:`, error);
      
      // Create fallback result with US coordinates
      const geocodeResult = {
        address: `${address} (Geocoding Failed)`,
        latitude: 39.8283,
        longitude: -98.5795, // Center of continental US
      };
      
      // Create error UI with map only (no direct static image)
      const imageCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Property Location (Approximate)`)
        .addChild(
          new AlertUIBuilder()
            .variant("warning")
            .title("Using Approximate Location")
            .message(`Unable to retrieve the exact location for ${address}. Showing an approximation.`)
            .build()
        )
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: geocodeResult.address,
                text: "📍",
              },
            ])
            .build()
        )
        .build();
      
      return {
        text: `Generated approximate property location for ${geocodeResult.address}. Note: This is using estimated location data.`,
        data: geocodeResult,
        ui: imageCard,
      };
    }
  },
};

// Update the generateVisualizationConfig handler to remove direct static images
const generateVisualizationConfig: ToolConfig = {
  id: "generate-visualization",
  name: "Generate Solar Visualization",
  description: "Creates visual representations of solar installation on a property",
  input: z
    .object({
      address: z.string().describe("Property address"),
      systemSize: z.number().describe("System size in kW"),
      panelCount: z.number().describe("Number of solar panels"),
      annualProduction: z.number().describe("Estimated annual energy production in kWh"),
      co2Reduction: z.number().optional().describe("Annual CO2 reduction in kg"),
    })
    .describe("System and property details for visualization"),
  output: z
    .object({
      address: z.string().describe("Property address"),
      monthlyProductionData: z.array(
        z.object({
          month: z.string(),
          production: z.number(),
        })
      ).describe("Monthly production data"),
      environmentalImpact: z.object({
        co2Reduction: z.number().describe("Annual CO2 reduction in kg"),
        treesEquivalent: z.number().describe("Equivalent number of trees planted"),
        carsEquivalent: z.number().describe("Equivalent cars removed from road"),
      }).describe("Environmental impact metrics"),
    })
    .describe("Visualization results"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { 
      address, 
      systemSize, 
      panelCount, 
      annualProduction,
      co2Reduction = 0
    },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested visualization for ${address}`
    );

    try {
      // Geocode the address to get coordinates
      const geocodeResult = await geocodeAddress(address);
      
      // Calculate CO2 reduction if not provided
      if (!co2Reduction) {
        co2Reduction = calculateCO2Reduction(annualProduction);
      }
      
      // Calculate environmental equivalents
      const treesEquivalent = Math.round(co2Reduction / 21);
      const carsEquivalent = Math.round(co2Reduction / 4600);
      
      // Generate monthly production data
      const monthlyProductionData = [
        { month: "Jan", production: Math.round(annualProduction * 0.06) },
        { month: "Feb", production: Math.round(annualProduction * 0.07) },
        { month: "Mar", production: Math.round(annualProduction * 0.08) },
        { month: "Apr", production: Math.round(annualProduction * 0.09) },
        { month: "May", production: Math.round(annualProduction * 0.11) },
        { month: "Jun", production: Math.round(annualProduction * 0.12) },
        { month: "Jul", production: Math.round(annualProduction * 0.12) },
        { month: "Aug", production: Math.round(annualProduction * 0.11) },
        { month: "Sep", production: Math.round(annualProduction * 0.09) },
        { month: "Oct", production: Math.round(annualProduction * 0.07) },
        { month: "Nov", production: Math.round(annualProduction * 0.05) },
        { month: "Dec", production: Math.round(annualProduction * 0.03) },
      ];
      
      // Create visualization result
      const visualizationResult = {
        address: geocodeResult.address,
        monthlyProductionData,
        environmentalImpact: {
          co2Reduction,
          treesEquivalent,
          carsEquivalent,
        },
      };

      // Create UI components
      const visualizationCard = new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new CardUIBuilder()
            .title(`Solar Installation at ${geocodeResult.address}`)
            .content(`This ${systemSize}kW system with ${panelCount} panels will produce approximately ${annualProduction.toLocaleString()} kWh annually.`)
            .build()
        )
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: `${systemSize}kW Solar System`,
                text: `${systemSize}kW`,
              },
            ])
            .build()
        )
        .addChild(
          new ChartUIBuilder()
            .type("bar")
            .title("Projected Monthly Production")
            .chartData(monthlyProductionData)
            .dataKeys({ x: "month", y: "production" })
            .build()
        )
        .addChild(
          new CardUIBuilder()
            .title("Environmental Impact")
            .content(`
              Your solar system will offset ${co2Reduction.toLocaleString()} kg of CO2 annually.
              
              This is equivalent to:
              - Planting ${treesEquivalent} trees
              - Taking ${carsEquivalent} cars off the road
            `)
            .build()
        )
        .build();

      return {
        text: `Generated visualization for ${systemSize}kW solar system at ${geocodeResult.address}. The system will produce approximately ${annualProduction.toLocaleString()} kWh annually and offset ${co2Reduction.toLocaleString()} kg of CO2.`,
        data: visualizationResult,
        ui: visualizationCard,
      };
    } catch (error) {
      console.error(`Error generating visualization:`, error);
      
      // Use fallback with US coordinates
      const geocodeResult = {
        address: `${address} (Geocoding Failed)`,
        latitude: 39.8283,
        longitude: -98.5795, // Center of continental US
      };
      
      // Calculate CO2 reduction if not provided
      if (!co2Reduction) {
        co2Reduction = calculateCO2Reduction(annualProduction);
      }
      
      // Calculate environmental equivalents
      const treesEquivalent = Math.round(co2Reduction / 21);
      const carsEquivalent = Math.round(co2Reduction / 4600);
      
      // Generate monthly production data
      const monthlyProductionData = [
        { month: "Jan", production: Math.round(annualProduction * 0.06) },
        { month: "Feb", production: Math.round(annualProduction * 0.07) },
        { month: "Mar", production: Math.round(annualProduction * 0.08) },
        { month: "Apr", production: Math.round(annualProduction * 0.09) },
        { month: "May", production: Math.round(annualProduction * 0.11) },
        { month: "Jun", production: Math.round(annualProduction * 0.12) },
        { month: "Jul", production: Math.round(annualProduction * 0.12) },
        { month: "Aug", production: Math.round(annualProduction * 0.11) },
        { month: "Sep", production: Math.round(annualProduction * 0.09) },
        { month: "Oct", production: Math.round(annualProduction * 0.07) },
        { month: "Nov", production: Math.round(annualProduction * 0.05) },
        { month: "Dec", production: Math.round(annualProduction * 0.03) },
      ];
      
      // Create fallback visualization result
      const visualizationResult = {
        address: geocodeResult.address,
        monthlyProductionData,
        environmentalImpact: {
          co2Reduction,
          treesEquivalent,
          carsEquivalent,
        },
      };
      
      // Create UI components with warning
      const visualizationCard = new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new AlertUIBuilder()
            .variant("warning")
            .title("Using Approximate Location")
            .message(`Unable to retrieve the exact property image for ${address}. Some visualizations are based on simulated data.`)
            .build()
        )
        .addChild(
          new CardUIBuilder()
            .title(`Solar Installation at ${geocodeResult.address}`)
            .content(`This ${systemSize}kW system with ${panelCount} panels will produce approximately ${annualProduction.toLocaleString()} kWh annually.`)
            .build()
        )
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: geocodeResult.address,
                description: `${systemSize}kW Solar System`,
                text: `${systemSize}kW`,
              },
            ])
            .build()
        )
        .addChild(
          new ChartUIBuilder()
            .type("bar")
            .title("Projected Monthly Production")
            .chartData(monthlyProductionData)
            .dataKeys({ x: "month", y: "production" })
            .build()
        )
        .addChild(
          new CardUIBuilder()
            .title("Environmental Impact")
            .content(`
              Your solar system will offset ${co2Reduction.toLocaleString()} kg of CO2 annually.
              
              This is equivalent to:
              - Planting ${treesEquivalent} trees
              - Taking ${carsEquivalent} cars off the road
            `)
            .build()
        )
        .build();
      
      return {
        text: `Generated visualization for ${systemSize}kW solar system at ${geocodeResult.address}. The system will produce approximately ${annualProduction.toLocaleString()} kWh annually and offset ${co2Reduction.toLocaleString()} kg of CO2. Note: Location data is simulated.`,
        data: visualizationResult,
        ui: visualizationCard,
      };
    }
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "Solar Advisor DAIN Service",
    description:
      "A comprehensive solar advisor that analyzes properties, recommends solar systems, calculates financials, and visualizes installations",
    version: "1.0.0",
    author: "Solar Flair",
    tags: ["solar", "renewable energy", "property analysis", "financial calculator"],
    logo: "https://cdn-icons-png.flaticon.com/512/181/181324.png",
  },
  exampleQueries: [
    {
      category: "Property Analysis",
      queries: [
        "Analyze solar potential for 123 Main St, San Francisco, CA",
        "What's the solar suitability of my roof at 456 Oak Ave, Austin, TX?",
        "Evaluate my home for solar panels at 789 Pine St, Seattle, WA",
      ],
    },
    {
      category: "Solar System",
      queries: [
        "Recommend a solar system for my 2,000 sq ft roof",
        "What size solar system do I need for a $200 monthly electric bill?",
        "Design a solar system with battery backup for my home",
      ],
    },
    {
      category: "Financial Analysis",
      queries: [
        "Calculate ROI for a 8kW solar system in California",
        "What would be my payback period for solar in Texas?",
        "Estimate solar savings for a 10kW system in Florida",
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    analyzePropertyConfig,
    recommendSolarSystemConfig,
    calculateFinancialsConfig,
    generateVisualizationConfig,
    generatePropertyImageConfig,
  ],
});

dainService.startNode({ port: port }).then(({ address }) => {
  console.log("Solar Advisor DAIN Service is running at :" + address().port);
});
