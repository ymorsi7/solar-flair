import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const address = formData.get('address') as string;
    
    // Check if address is provided
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    // Get roof images
    const roofImages = formData.getAll('roofImages') as File[];
    if (roofImages.length === 0) {
      return NextResponse.json({ error: 'At least one roof image is required' }, { status: 400 });
    }
    
    // Optional utility bill
    const utilityBill = formData.get('utilityBill') as File | null;
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
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
    
    // Convert images to base64 for Gemini
    const imagePartsPromises = roofImages.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      
      return {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      };
    });
    
    const imageParts = await Promise.all(imagePartsPromises);
    
    // Add utility bill if provided
    const parts: any[] = [
      { text: `Generate a comprehensive solar assessment for this address: ${address}. Analyze the provided roof images.` },
      ...imageParts
    ];
    
    if (utilityBill) {
      const utilityArrayBuffer = await utilityBill.arrayBuffer();
      const utilityBase64 = Buffer.from(utilityArrayBuffer).toString('base64');
      
      parts.push({
        inlineData: {
          data: utilityBase64,
          mimeType: utilityBill.type,
        },
      });
      
      parts[0].text += " Also analyze the attached utility bill to provide more accurate savings estimates.";
    }
    
    // Add structured output instructions
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
    
    let assessment;
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      assessment = JSON.parse(jsonStr);
    } else {
      assessment = JSON.parse(text);
    }
    
    // Return the assessment as JSON
    return NextResponse.json(assessment);
    
  } catch (error: any) {
    console.error('Error in assessment API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the assessment' },
      { status: 500 }
    );
  }
}

// Support GET request for testing
export async function GET() {
  // Return a mock response for testing
  return NextResponse.json({
    address: "123 Main St, Los Angeles, CA 90001",
    solarPotential: {
      annualProduction: 12500,
      recommendedSystemSize: 8.5,
      monthlySavings: 185,
      paybackPeriod: 7.2,
      co2Reduction: 8750
    },
    roofAnalysis: {
      suitableArea: 42,
      optimalDirection: "South-West",
      shadingIssues: "Minimal",
      recommendedPanels: 24
    },
    financialAnalysis: {
      installationCost: 27500,
      federalTaxCredit: 8250,
      stateTaxCredit: 2000,
      netCost: 17250,
      projectedSavings25yr: 83000,
      roi: 15.7
    }
  });
} 