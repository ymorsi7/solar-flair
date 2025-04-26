interface GeoData {
    lat: number;
    lng: number;
    std?: string;
  }
  
  interface UtilityData {
    provider: string;
    rate: number;
    netMetering: boolean;
    timeOfUseRates: boolean;
  }
  
  // Database of utility information by region
  const utilityDatabase = {
    "CA": [
      {
        name: "Pacific Gas & Electric (PG&E)",
        defaultRate: 0.31,
        hasNetMetering: true,
        hasTimeOfUse: true,
        serviceBounds: {
          // Simplified polygon for Northern California
          latMin: 35.0, latMax: 42.0,
          lngMin: -124.0, lngMax: -118.0
        }
      },
      {
        name: "Southern California Edison (SCE)",
        defaultRate: 0.28,
        hasNetMetering: true,
        hasTimeOfUse: true,
        serviceBounds: {
          // Simplified polygon for Southern California
          latMin: 32.5, latMax: 36.0,
          lngMin: -121.0, lngMax: -114.0
        }
      }
    ],
    "NY": [
      {
        name: "Con Edison",
        defaultRate: 0.26,
        hasNetMetering: true,
        hasTimeOfUse: true,
        serviceBounds: {
          // Simplified polygon for NYC area
          latMin: 40.5, latMax: 41.2,
          lngMin: -74.3, lngMax: -73.7
        }
      }
    ]
    // Add more states and utilities as needed
  };
  
  export async function getUtilityRates(geoData: GeoData, providedUtility?: string): Promise<UtilityData> {
    console.log(`Getting utility data for location: ${geoData.lat}, ${geoData.lng}`);
    
    // If user provided a utility, use that
    if (providedUtility) {
      // Search all utilities for a match
      for (const state in utilityDatabase) {
        const utility = utilityDatabase[state].find(u => 
          u.name.toLowerCase().includes(providedUtility.toLowerCase()));
        
        if (utility) {
          return {
            provider: utility.name,
            rate: utility.defaultRate,
            netMetering: utility.hasNetMetering,
            timeOfUseRates: utility.hasTimeOfUse
          };
        }
      }
    }
    
    // Extract state from standardized address if available
    let state = "";
    if (geoData.std) {
      const stateMatch = geoData.std.match(/[A-Z]{2}\s+\d{5}/);
      if (stateMatch) {
        state = stateMatch[0].substring(0, 2);
      }
    }
    
    // Find utility by location
    if (state && utilityDatabase[state]) {
      for (const utility of utilityDatabase[state]) {
        const bounds = utility.serviceBounds;
        if (geoData.lat >= bounds.latMin && geoData.lat <= bounds.latMax &&
            geoData.lng >= bounds.lngMin && geoData.lng <= bounds.lngMax) {
          return {
            provider: utility.name,
            rate: utility.defaultRate,
            netMetering: utility.hasNetMetering,
            timeOfUseRates: utility.hasTimeOfUse
          };
        }
      }
    }
    
    // Default to national average if no match found
    return {
      provider: "Local Utility",
      rate: 0.16, // National average electricity rate
      netMetering: true,
      timeOfUseRates: false
    };
  }