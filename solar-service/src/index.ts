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
      // In a real implementation, this would call a geocoding API
      // For demo purposes, we'll simulate the response
      
      // Simulate geocoding API call
      const geocodeResult = {
        address: address,
        latitude: 37.7749,
        longitude: -122.4194,
      };
      
      // Simulate roof analysis based on satellite imagery
      // In a real implementation, this would use ML models on satellite imagery
      const roofAnalysis = {
        roofArea: 1800,  // square feet
        roofType: "Composite Shingle",
        roofSlope: 22,   // degrees
        sunExposure: 8.5, // 0-10 rating
        shadingFactor: 15, // percentage of shading
      };
      
      // Calculate suitability score
      const suitabilityScore = calculateSolarSuitabilityScore(
        roofAnalysis.roofArea,
        roofAnalysis.sunExposure,
        roofAnalysis.shadingFactor / 100
      );
      
      // Calculate optimal tilt
      const optimalTiltAngle = calculateOptimalTilt(geocodeResult.latitude);
      
      // Create response object
      const analysisResult = {
        address: geocodeResult.address,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        roofArea: roofAnalysis.roofArea,
        suitabilityScore: suitabilityScore,
        sunExposure: roofAnalysis.sunExposure,
        shadingFactor: roofAnalysis.shadingFactor,
        roofType: roofAnalysis.roofType,
        roofSlope: roofAnalysis.roofSlope,
        optimalTiltAngle: optimalTiltAngle,
      };

      // Create UI component
      const propertyCard = new CardUIBuilder()
        .setRenderMode("page")
        .title(`Solar Analysis for ${address}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(geocodeResult.latitude, geocodeResult.longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude,
                title: address,
                description: `Suitability: ${suitabilityScore}/100`,
                text: `${suitabilityScore}/100`,
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
              { property: "Solar Suitability Score", value: `${suitabilityScore}/100` },
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
        text: `Property at ${address} has a solar suitability score of ${suitabilityScore}/100 with ${roofAnalysis.roofArea} sq ft of usable roof area.`,
        data: analysisResult,
        ui: propertyCard,
      };
    } catch (error) {
      console.error(`Error analyzing property:`, error);
      
      return {
        text: `Error analyzing property: ${error.message}. Please check the address and try again.`,
        data: { error: error.message },
        ui: new AlertUIBuilder()
          .variant("error")
          .title("Property Analysis Failed")
          .message(`Unable to analyze property at ${address}. Please verify the address is correct.`)
          .build(),
      };
    }
  },
};

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
    { roofArea, suitabilityScore, monthlyUsage = 900, budgetConstraint, preferHighEfficiency = false, batteryStorage = false },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested solar system recommendation`
    );

    try {
      // Calculate system size based on roof area and/or energy usage
      // In a real implementation, this would be more sophisticated
      
      // Approach 1: Based on roof area
      const maxSizeByRoofArea = (roofArea * 0.01); // Simplified calculation
      
      // Approach 2: Based on energy usage
      const yearlyUsage = monthlyUsage * 12;
      const estimatedProduction = yearlyUsage * 1.1; // 10% buffer
      const sizeByUsage = estimatedProduction / 1400; // Average production per kW
      
      // Take the smaller of the two approaches
      let recommendedSystemSize = Math.min(maxSizeByRoofArea, sizeByUsage);
      
      // Apply budget constraint if provided
      if (budgetConstraint) {
        const maxSizeByBudget = budgetConstraint / (preferHighEfficiency ? 3000 : 2500);
        recommendedSystemSize = Math.min(recommendedSystemSize, maxSizeByBudget);
      }
      
      // Round to nearest 0.5 kW
      recommendedSystemSize = Math.round(recommendedSystemSize * 2) / 2;
      
      // Determine panel specifications
      const panelWattage = preferHighEfficiency ? 450 : 400;
      const panelEfficiency = preferHighEfficiency ? 22.5 : 20;
      
      // Calculate number of panels needed
      const panelCount = calculatePanelCount(recommendedSystemSize, panelWattage);
      
      // Estimate annual production
      const annualProduction = calculateAnnualProduction(recommendedSystemSize, suitabilityScore);
      
      // Determine installation type based on roof characteristics
      const installationType = "Fixed Roof Mount";
      
      // Battery details if requested
      const includeBattery = batteryStorage;
      const batteryCapacity = batteryStorage ? 13.5 : 0; // Example: Tesla Powerwall
      
      // Create recommendation object
      const recommendation = {
        recommendedSystemSize,
        panelType: preferHighEfficiency ? "High-Efficiency Monocrystalline" : "Standard Monocrystalline",
        panelCount,
        panelWattage,
        panelEfficiency,
        annualProduction,
        installationType,
        includeBattery,
        batteryCapacity: includeBattery ? batteryCapacity : undefined,
      };

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
              { detail: "System Size", value: `${recommendedSystemSize} kW` },
              { detail: "Panel Type", value: recommendation.panelType },
              { detail: "Panel Count", value: `${panelCount}` },
              { detail: "Panel Wattage", value: `${panelWattage} W` },
              { detail: "Panel Efficiency", value: `${panelEfficiency}%` },
              { detail: "Annual Production", value: `${annualProduction.toLocaleString()} kWh` },
              { detail: "Installation Type", value: installationType },
              { detail: "Battery Storage", value: includeBattery ? `Yes (${batteryCapacity} kWh)` : "No" },
            ])
            .build()
        )
        .addChild(
          new ChartUIBuilder()
            .type("bar")
            .title("Projected Monthly Production")
            .chartData([
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
            ])
            .dataKeys({ x: "month", y: "production" })
            .build()
        )
        .content(`Based on your roof area of ${roofArea} sq ft and electricity usage of ${monthlyUsage} kWh/month, we recommend a ${recommendedSystemSize} kW system with ${panelCount} panels.`)
        .build();

      return {
        text: `Recommended a ${recommendedSystemSize} kW solar system with ${panelCount} ${recommendation.panelType} panels, producing approximately ${annualProduction.toLocaleString()} kWh annually.`,
        data: recommendation,
        ui: systemCard,
      };
    } catch (error) {
      console.error(`Error generating system recommendation:`, error);
      
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

const generateVisualizationConfig: ToolConfig = {
  id: "generate-visualization",
  name: "Generate Solar Visualization",
  description: "Creates visual representations of solar installation on a property including panel placement, production charts, and environmental impact",
  input: z
    .object({
      address: z.string().describe("Property address"),
      latitude: z.number().describe("Property latitude"),
      longitude: z.number().describe("Property longitude"),
      systemSize: z.number().describe("System size in kW"),
      panelCount: z.number().describe("Number of solar panels"),
      annualProduction: z.number().describe("Estimated annual energy production in kWh"),
      co2Reduction: z.number().optional().describe("Annual CO2 reduction in kg"),
    })
    .describe("System and property details for visualization"),
  output: z
    .object({
      propertyImageUrl: z.string().describe("URL of property visualization with panels"),
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
      latitude, 
      longitude, 
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
      // Calculate CO2 reduction if not provided
      if (!co2Reduction) {
        co2Reduction = calculateCO2Reduction(annualProduction);
      }
      
      // Calculate environmental equivalents
      const treesEquivalent = Math.round(co2Reduction / 21); // 21 kg CO2 per tree per year
      const carsEquivalent = Math.round(co2Reduction / 4600); // 4,600 kg CO2 per car per year
      
      // Generate monthly production data
      // In a real implementation, this would be based on location-specific solar irradiance data
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
      
      // In a real implementation, we would generate an actual property image with panels
      // For this demo, we'll use a placeholder URL
      const propertyImageUrl = "https://cdn-icons-png.flaticon.com/512/181/181324.png";
      
      // Create visualization result
      const visualizationResult = {
        propertyImageUrl,
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
            .title(`Solar Installation at ${address}`)
            .content(`This ${systemSize}kW system with ${panelCount} panels will produce approximately ${annualProduction.toLocaleString()} kWh annually.`)
            .build()
        )
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 18)
            .setMapStyle("mapbox://styles/mapbox/satellite-v9")
            .addMarkers([
              {
                latitude,
                longitude,
                title: address,
                description: `${systemSize}kW Solar System`,
                text: `${systemSize}kW`,
              },
            ])
            .build()
        )
        .addChild(
          new ImageCardUIBuilder("https://cdn-icons-png.flaticon.com/512/181/181324.png")
            .title("Solar Panel Visualization")
            .description("Visualization of solar panels on your property (sample image)")
            .imageAlt("Solar Panel Visualization")
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
        text: `Generated visualization for ${systemSize}kW solar system at ${address}. The system will produce approximately ${annualProduction.toLocaleString()} kWh annually and offset ${co2Reduction.toLocaleString()} kg of CO2.`,
        data: visualizationResult,
        ui: visualizationCard,
      };
    } catch (error) {
      console.error(`Error generating visualization:`, error);
      
      return {
        text: `Error generating visualization: ${error.message}.`,
        data: { error: error.message },
        ui: new AlertUIBuilder()
          .variant("error")
          .title("Visualization Failed")
          .message("Unable to generate solar visualization. Please check your inputs and try again.")
          .build(),
      };
    }
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "ahmed DAIN Service",
    description:
      "A DAIN service for current weather and forecasts using Open-Meteo API",
    version: "1.0.0",
    author: "ahmed",
    tags: ["weather", "forecast", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png",
  },
  exampleQueries: [
    {
      category: "Weather",
      queries: [
        "What is the weather in Tokyo?",
        "What is the weather in San Francisco?",
        "What is the weather in London?",
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getWeatherConfig, getWeatherForecastConfig, analyzePropertyConfig, recommendSolarSystemConfig, calculateFinancialsConfig, generateVisualizationConfig],
});

dainService.startNode({ port: port }).then(({ address }) => {
  console.log("Weather DAIN Service is running at :" + address().port);
});
