import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Safety settings to avoid harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Function to convert file to base64
export async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

// Analyze roof images for solar potential
export async function analyzeSolarPotential(address: string, roofImages: File[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Convert images to format needed for Gemini
    const imageParts = await Promise.all(roofImages.map(fileToGenerativePart));
    
    // Create prompt for Gemini
    const prompt = `Analyze these roof images for solar panel installation potential at address: ${address}.
    
    Evaluate and provide a detailed JSON response with the following structure:
    {
      "roofAnalysis": {
        "suitableArea": [usable roof area in square meters],
        "optimalDirection": [best roof direction for panels],
        "shadingIssues": [description of shading problems if any],
        "recommendedPanels": [number of panels that would fit]
      },
      "solarPotential": {
        "annualProduction": [estimated kWh per year],
        "recommendedSystemSize": [system size in kW],
        "monthlySavings": [estimated monthly savings in dollars],
        "paybackPeriod": [years to payback],
        "co2Reduction": [kg of CO2 saved annually]
      }
    }`;
    
    // Run the Gemini model
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    // Extract the JSON from the response
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON from the response
    // Extract JSON if it's surrounded by markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing solar potential:", error);
    throw new Error("Failed to analyze solar potential");
  }
}

// Analyze utility bill for consumption patterns
export async function analyzeUtilityBill(bill: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Convert bill to format needed for Gemini
    const billPart = await fileToGenerativePart(bill);
    
    // Create prompt for Gemini
    const prompt = `Analyze this utility bill and extract the following information in JSON format:
    {
      "monthlyConsumption": [kWh used],
      "monthlyCost": [bill amount in dollars],
      "rate": [cost per kWh],
      "provider": [utility company name],
      "trends": [brief description of usage patterns]
    }`;
    
    // Run the Gemini model
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            billPart
          ]
        }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    // Extract the JSON from the response
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON from the response
    // Extract JSON if it's surrounded by markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing utility bill:", error);
    throw new Error("Failed to analyze utility bill");
  }
}

// Generate comprehensive solar assessment
export async function generateSolarAssessment(address: string, roofImages: File[], utilityBill?: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Convert all files to format needed for Gemini
    const imageParts = await Promise.all(roofImages.map(fileToGenerativePart));
    const parts: any[] = [{ text: `Perform a comprehensive solar assessment for this address: ${address}` }, ...imageParts];
    
    // Add utility bill if provided
    if (utilityBill) {
      const billPart = await fileToGenerativePart(utilityBill);
      parts.push(billPart);
      parts[0].text += ` and analyze the attached utility bill.`;
    }
    
    parts[0].text += `\n\nProvide a detailed JSON response with the following structure:
    {
      "address": "${address}",
      "solarPotential": {
        "annualProduction": [estimated kWh per year],
        "recommendedSystemSize": [system size in kW],
        "monthlySavings": [estimated monthly savings in dollars],
        "paybackPeriod": [years to payback],
        "co2Reduction": [kg of CO2 saved annually]
      },
      "roofAnalysis": {
        "suitableArea": [usable roof area in square meters],
        "optimalDirection": [best roof direction for panels],
        "shadingIssues": [description of shading problems if any],
        "recommendedPanels": [number of panels that would fit]
      },
      "financialAnalysis": {
        "installationCost": [estimated cost in dollars],
        "federalTaxCredit": [federal incentives in dollars],
        "stateTaxCredit": [state incentives in dollars],
        "netCost": [cost after incentives in dollars],
        "projectedSavings25yr": [25-year savings in dollars],
        "roi": [return on investment percentage]
      }
    }`;
    
    // Run the Gemini model
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });
    
    // Extract the JSON from the response
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON from the response
    // Extract JSON if it's surrounded by markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating solar assessment:", error);
    throw new Error("Failed to generate solar assessment");
  }
} 