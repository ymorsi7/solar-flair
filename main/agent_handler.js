// DAIN Agent Handler for Solar Analysis

const { analyzeSolarPotential } = require('./index');

// This is the main handler for the DAIN agent
async function handleUserRequest(request, context) {
  const { message, user } = request;
  
  // Check if this is an address input
  if (isAddressInput(message)) {
    return processAddressInput(message, user, context);
  }
  
  // Check if this is a follow-up question about results
  if (isFollowUpQuestion(message, context)) {
    return answerFollowUpQuestion(message, context);
  }
  
  // Otherwise, provide guidance
  return {
    response: `I can analyze the solar potential of any property. Simply provide me with the address, and I'll determine how much electricity it could generate with solar panels.
    
For example, you can say: "Analyze solar potential for 123 Main St, Anytown, CA"
    
I can also estimate costs, recommend the best panel materials, and determine optimal panel placement.`,
    suggestions: [
      "What information do you need from me?",
      "How accurate is your solar analysis?",
      "Can you explain how solar panels work?"
    ]
  };
}

// Check if the message appears to be an address
function isAddressInput(message) {
  // Simple check for address patterns
  return (
    message.includes("analyze") && 
    (message.includes("street") || message.includes("avenue") || message.includes("road") || 
     message.includes("lane") || message.includes("drive") || message.includes("st") || 
     message.includes("ave") || message.includes("rd") || message.includes("ln") || message.includes("dr"))
  );
}

// Process an address input
async function processAddressInput(message, user, context) {
  // Extract the address from the message
  const address = extractAddress(message);
  
  if (!address) {
    return {
      response: "I couldn't identify a valid address in your message. Please provide a complete address including street, city, and state.",
      suggestions: [
        "Analyze solar potential for 123 Main St, Anytown, CA",
        "What format should I use for the address?"
      ]
    };
  }
  
  try {
    // Send an initial response while processing
    context.sendIntermediateResponse({
      response: `I'm analyzing the solar potential for ${address}. This will take a moment while I retrieve satellite imagery and perform calculations...`
    });
    
    // Call the main analysis function
    const result = await analyzeSolarPotential({
      address,
      // Optional parameters could be extracted from the message or user preferences
      budget: extractBudget(message),
      energy_needs: user.preferences?.energy_needs
    }, context);
    
    // Store the results in the conversation context for follow-up questions
    context.conversationState.solarResults = result.data;
    
    // Format a user-friendly response
    return formatAnalysisResponse(result.data);
  } catch (error) {
    console.error("Error processing address:", error);
    return {
      response: `I encountered an error while analyzing ${address}: ${error.message}. Please check the address and try again.`,
      suggestions: [
        "Try a different address",
        "What might have caused this error?"
      ]
    };
  }
}

// Check if this is a follow-up question about previous results
function isFollowUpQuestion(message, context) {
  return (
    context.conversationState.solarResults &&
    (message.includes("panel") || 
     message.includes("cost") || 
     message.includes("save") || 
     message.includes("roi") || 
     message.includes("orientation") || 
     message.includes("material"))
  );
}

// Answer a follow-up question about previous results
function answerFollowUpQuestion(message, context) {
  const results = context.conversationState.solarResults;
  
  if (message.includes("panel") && message.includes("material")) {
    return {
      response: `Based on my analysis, I recommend ${results.recommendations.panelMaterial} solar panels for your property. This recommendation is based on your local climate conditions and roof characteristics.`,
      suggestions: [
        "Why this material?",
        "How much will it cost?",
        "How many panels do I need?"
      ]
    };
  }
  
  if (message.includes("orientation") || message.includes("direction")) {
    return {
      response: `The optimal orientation for solar panels on your property is ${results.recommendations.orientation} facing, with a tilt angle of ${results.recommendations.tiltAngle}°. This maximizes solar exposure throughout the year based on your location.`,
      suggestions: [
        "Why this orientation?",
        "Can I adjust the angle seasonally?",
        "What if my roof faces a different direction?"
      ]
    };
  }
  
  if (message.includes("cost") || message.includes("price") || message.includes("expensive")) {
    return {
      response: `The estimated cost for installing a ${results.recommendations.systemSize.toFixed(1)} kW solar system on your property is approximately $${results.recommendations.installationCost.toLocaleString()}. This includes panels, inverters, mounting hardware, and installation labor.`,
      suggestions: [
        "Are there any incentives available?",
        "How long until I break even?",
        "Can I finance this?"
      ]
    };
  }
  
  if (message.includes("save") || message.includes("saving") || message.includes("roi") || message.includes("return")) {
    const annualSavings = results.recommendations.annualProduction * 0.15; // Assuming $0.15/kWh
    const paybackYears = results.recommendations.installationCost / annualSavings;
    
    return {
      response: `Based on your estimated annual production of ${Math.round(results.recommendations.annualProduction)} kWh, you could save approximately $${Math.round(annualSavings).toLocaleString()} per year on electricity bills. This gives you a payback period of about ${paybackYears.toFixed(1)} years and an ROI of ${results.recommendations.roi}% over the 25-year lifespan of the system.`,
      suggestions: [
        "How did you calculate this?",
        "What if electricity rates increase?",
        "What's the environmental impact?"
      ]
    };
  }
  
  // Default response for other follow-up questions
  return {
    response: `I have detailed information about your solar analysis results. What specific aspect would you like to know more about? You can ask about panel materials, orientation, costs, savings, or environmental impact.`,
    suggestions: [
      "What panel material is best for me?",
      "How much will I save?",
      "What's the environmental impact?"
    ]
  };
}

// Helper function to extract address from message
function extractAddress(message) {
  // This would use NLP or regex to extract the address
  // Simple implementation for demonstration
  const addressMatch = message.match(/for\s+([\d\w\s,\.]+)/i);
  return addressMatch ? addressMatch[1].trim() : null;
}

// Helper function to extract budget from message
function extractBudget(message) {
  // This would use NLP or regex to extract the budget
  // Simple implementation for demonstration
  const budgetMatch = message.match(/budget\s+[\$]?(\d+[,\d]*)/i);
  return budgetMatch ? parseFloat(budgetMatch[1].replace(',', '')) : null;
}

// Format the analysis response in a user-friendly way
function formatAnalysisResponse(results) {
  return {
    response: `I've completed the solar analysis for your property!

Based on the satellite imagery and local climate data, your property has excellent solar potential. Here's what I found:

• Recommended system size: ${results.recommendations.systemSize.toFixed(1)} kW
• Estimated annual production: ${Math.round(results.recommendations.annualProduction).toLocaleString()} kWh
• Recommended panel material: ${results.recommendations.panelMaterial}
• Optimal orientation: ${results.recommendations.orientation} facing at ${results.recommendations.tiltAngle}° tilt
• Estimated installation cost: $${results.recommendations.installationCost.toLocaleString()}
• Return on Investment (ROI): ${results.recommendations.roi}%

This system would offset approximately ${Math.round(results.report.environmentalImpact.co2Offset).toLocaleString()} kg of CO2 annually, equivalent to planting ${Math.round(results.report.environmentalImpact.co2Offset / 20)} trees.

Would you like more details about any specific aspect of this analysis?`,
    suggestions: [
      "Tell me more about panel materials",
      "How much will I save on electricity?",
      "What's the payback period?",
      "Show me the satellite image"
    ],
    attachments: [
      {
        type: "image",
        url: results.satellite_image_url,
        title: "Satellite View of Property"
      }
    ]
  };
}

// Export the handler function
module.exports = {
  handleUserRequest
};