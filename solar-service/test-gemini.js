// Test script for Gemini API
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADDRESS = "7540 Golfcrest Dr, San Diego, CA 92119";
const LATITUDE = 32.7957;
const LONGITUDE = -117.0291;

async function listModels() {
  try {
    console.log("Listing available Gemini models...");
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );
    
    console.log("Available models:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error("Error listing models:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

async function testGeminiAPI() {
  try {
    console.log("Testing Gemini API integration...");
    
    // Use the gemini-1.5-flash model (most current working model)
    const modelName = "gemini-1.5-flash";
    
    // Create a prompt that asks for specific roof analysis details
    const prompt = `Analyze the rooftop solar potential for a property at ${ADDRESS} (coordinates: ${LATITUDE}, ${LONGITUDE}).
    
    Provide the following data points only, with no explanations:
    1. Roof area in square feet (only for the specific address, not neighboring houses)
    2. Solar suitability score from 0-100
    3. Average daily sun exposure in hours
    4. Roof type (e.g., Composite Shingle, Metal, Tile)
    5. Roof slope in degrees
    6. Percentage of shading
    
    Format your response as JSON like this:
    {
      "roofArea": [number],
      "suitabilityScore": [number],
      "sunExposure": [number],
      "roofType": [string],
      "roofSlope": [number],
      "shadingFactor": [number]
    }
    
    Base your analysis on any geospatial data you can access for this specific address.`;
    
    // Call Gemini API for analysis
    console.log("Sending request to Gemini API...");
    console.log(`Using model: ${modelName}`);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
    );
    
    // Print full response
    console.log("Gemini API raw response:", JSON.stringify(response.data, null, 2));
    
    // Extract the response text
    const responseText = response.data.candidates[0].content.parts[0].text;
    console.log("\nGemini API text response:", responseText);
    
    // Extract the JSON part
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const roofData = JSON.parse(jsonMatch[0]);
      console.log("\nParsed roof data:", roofData);
    } else {
      console.error("Could not parse JSON from Gemini response");
    }
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error testing Gemini API:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testGeminiAPI(); 