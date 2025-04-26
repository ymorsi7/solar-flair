/**
 * Utility functions for solar calculations
 * These functions handle the mathematical calculations for solar potential analysis
 */

// Calculate optimal tilt angle based on latitude
function calculateOptimalTilt(latitude) {
    // A common rule of thumb is to set the tilt angle equal to the latitude
    // This maximizes annual production
    return Math.abs(latitude);
  }
  
  // Calculate azimuth factor based on roof orientation
  function calculateAzimuthFactor(azimuth) {
    // In Northern Hemisphere, south = 180 degrees is optimal
    // In Southern Hemisphere, north = 0 degrees is optimal
    // This calculates a factor between 0 and 1 based on deviation from optimal
    const isNorthernHemisphere = true; // This would be determined by latitude
    const optimalAzimuth = isNorthernHemisphere ? 180 : 0;
    
    const deviation = Math.abs(azimuth - optimalAzimuth);
    return Math.cos(deviation * Math.PI / 180);
  }
  
  // Calculate tilt factor based on roof pitch
  function calculateTiltFactor(tilt, latitude) {
    // Calculate how close the tilt is to the optimal angle
    const optimalTilt = calculateOptimalTilt(latitude);
    const deviation = Math.abs(tilt - optimalTilt);
    
    // Simplified calculation - in reality this would be more complex
    // Returns a value between 0.9 and 1.0
    return Math.max(0.9, 1 - (deviation / 90) * 0.1);
  }
  
  // Calculate solar radiation based on location and roof characteristics
  function calculateSolarRadiation(latitude, longitude, tilt, azimuth, shading = 0) {
    // This would typically use external data sources or APIs
    // For demonstration, we'll use a simplified model
    
    // Base solar radiation (kWh/m²/year) - varies by location
    // This would come from a database or API in a real implementation
    const baseSolarRadiation = 1600 - Math.abs(latitude - 35) * 10;
    
    // Adjust for tilt
    const tiltFactor = calculateTiltFactor(tilt, latitude);
    
    // Adjust for azimuth
    const azimuthFactor = calculateAzimuthFactor(azimuth);
    
    // Adjust for shading (0 = no shade, 1 = complete shade)
    const shadingFactor = 1 - shading;
    
    // Calculate adjusted solar radiation
    return baseSolarRadiation * tiltFactor * azimuthFactor * shadingFactor;
  }
  
  // Calculate system size based on roof area and panel efficiency
  function calculateSystemSize(roofArea, panelEfficiency = 0.15, panelDensity = 0.9) {
    // Panel density accounts for spacing and mounting hardware
    // Standard solar panels are about 15-20% efficient
    
    // 1 kW typically requires about 6-7 m² of panels
    const areaPerKw = 6.5 / panelEfficiency * (1 / panelDensity);
    
    // Calculate system size in kW
    return roofArea / areaPerKw;
  }
  
  // Calculate annual production based on system size and solar radiation
  function calculateAnnualProduction(systemSize, solarRadiation, systemEfficiency = 0.8) {
    // System efficiency accounts for inverter losses, wiring, etc.
    return systemSize * solarRadiation * systemEfficiency;
  }
  
  // Calculate number of panels needed
  function calculatePanelCount(systemSize, panelWattage = 350) {
    // Convert system size from kW to W
    const systemWattage = systemSize * 1000;
    
    // Calculate number of panels
    return Math.ceil(systemWattage / panelWattage);
  }
  
  // Calculate installation cost
  function calculateInstallationCost(systemSize, costPerWatt = 3) {
    // National average is around $3 per watt
    // This varies by location, installer, and equipment quality
    return systemSize * 1000 * costPerWatt;
  }
  
  // Calculate ROI and payback period
  function calculateROI(installationCost, annualProduction, electricityRate = 0.15, systemLifespan = 25) {
    // Calculate annual savings
    const annualSavings = annualProduction * electricityRate;
    
    // Calculate simple payback period (years)
    const paybackPeriod = installationCost / annualSavings;
    
    // Calculate lifetime savings
    const lifetimeSavings = annualSavings * systemLifespan;
    
    // Calculate ROI percentage
    const roi = ((lifetimeSavings - installationCost) / installationCost) * 100;
    
    return {
      annualSavings,
      paybackPeriod,
      lifetimeSavings,
      roi
    };
  }
  
  // Calculate environmental impact
  function calculateEnvironmentalImpact(annualProduction) {
    // Average CO2 emissions per kWh of electricity in the US
    const co2PerKwh = 0.7; // kg CO2 per kWh
    
    // Calculate CO2 offset
    const co2Offset = annualProduction * co2PerKwh;
    
    // Calculate equivalent trees planted
    // Average tree absorbs about 20 kg CO2 per year
    const treesEquivalent = co2Offset / 20;
    
    // Calculate equivalent car miles not driven
    // Average car emits about 404 grams CO2 per mile
    const carMilesEquivalent = co2Offset * 1000 / 404;
    
    return {
      co2Offset,
      treesEquivalent,
      carMilesEquivalent
    };
  }
  
  module.exports = {
    calculateOptimalTilt,
    calculateAzimuthFactor,
    calculateTiltFactor,
    calculateSolarRadiation,
    calculateSystemSize,
    calculateAnnualProduction,
    calculatePanelCount,
    calculateInstallationCost,
    calculateROI,
    calculateEnvironmentalImpact
  };