// DAIN Service Definition for Solar Analysis Agent
module.exports = {
    name: "Solar Analysis Agent",
    description: "Analyzes properties for solar panel potential using satellite imagery",
    version: "1.0.0",
    
    // Define the tools/functions this service provides
    tools: [
      {
        name: "analyze_solar_potential",
        description: "Analyzes solar potential for a given address",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Full property address"
            },
            budget: {
              type: "number",
              description: "Optional budget constraint in USD"
            },
            energy_needs: {
              type: "number",
              description: "Optional monthly energy needs in kWh"
            }
          },
          required: ["address"]
        },
        handler: "analyzeSolarPotential"
      },
      {
        name: "get_satellite_image",
        description: "Retrieves satellite imagery for a given address",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Full property address"
            }
          },
          required: ["address"]
        },
        handler: "getSatelliteImage"
      },
      {
        name: "calculate_solar_roi",
        description: "Calculates return on investment for solar installation",
        parameters: {
          type: "object",
          properties: {
            system_size: {
              type: "number",
              description: "System size in kW"
            },
            address: {
              type: "string",
              description: "Property address for electricity rates"
            },
            installation_cost: {
              type: "number",
              description: "Total installation cost in USD"
            }
          },
          required: ["system_size", "address"]
        },
        handler: "calculateSolarROI"
      }
    ],
    
    // Define external API dependencies
    dependencies: {
      "google-maps-platform": "^1.0.0",
      "gemini-ai": "^1.0.0",
      "weather-api": "^1.0.0"
    }
  };