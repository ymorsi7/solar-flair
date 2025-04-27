import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON request body
    const body = await request.json();
    const { 
      address, 
      systemSize, 
      panelType,
      orientation,
      roofImage,
      optimizationPreference
    } = body;
    
    // Validate request
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    if (!systemSize) {
      return NextResponse.json({ error: 'System size is required' }, { status: 400 });
    }
    
    // Check if roof image is provided
    if (!roofImage) {
      return NextResponse.json({ error: 'Roof image is required' }, { status: 400 });
    }
    
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
    
    // Decode roof image base64 
    // In a real implementation, this would come from a file upload
    // For demo purposes, we're assuming it's already in base64 format
    
    // Create the prompt for Gemini
    const prompt = `
    Design a solar panel system layout for a house at ${address} with a ${systemSize}kW system.
    
    Details:
    - Panel type: ${panelType || 'Standard 400W panels'}
    - Roof orientation: ${orientation || 'Unknown (analyze from image)'}
    - Optimization preference: ${optimizationPreference || 'Balance between production and aesthetics'}
    
    Analyze the provided roof image and create a design that:
    1. Optimizes solar energy production
    2. Places panels in a visually appealing arrangement
    3. Avoids obstacles like chimneys, vents, and skylights
    4. Follows best practices for solar panel installation
    
    Provide the design as a detailed JSON response with the following structure:
    {
      "design": {
        "panelCount": [number of panels],
        "panelLayout": [description of layout],
        "estimatedProduction": [annual kWh],
        "installationNotes": [important installation considerations],
        "optimizations": [suggestions for improving the design]
      },
      "layoutImage": {
        "description": [detailed description of how panels should be positioned]
      },
      "specifications": {
        "panelType": [panel model and specifications],
        "inverterRecommendation": [recommended inverter],
        "mountingHardware": [recommended mounting system]
      }
    }`;
    
    // Run the Gemini model
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: roofImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''),
                mimeType: roofImage.includes('png') ? 'image/png' : 'image/jpeg',
              }
            }
          ]
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
    
    let design;
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      design = JSON.parse(jsonStr);
    } else {
      design = JSON.parse(text);
    }
    
    // Return the design as JSON
    return NextResponse.json(design);
    
  } catch (error: any) {
    console.error('Error in design API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the design process' },
      { status: 500 }
    );
  }
}

// Support GET request for testing
export async function GET() {
  // Return a mock response for testing
  return NextResponse.json({
    design: {
      panelCount: 24,
      panelLayout: "Two rows of 6 panels on the south-facing roof section, plus two rows of 6 panels on the southwest-facing section.",
      estimatedProduction: 12500,
      installationNotes: "Avoid the chimney area on the southern section. Use a low-profile mounting system due to potential wind exposure.",
      optimizations: [
        "Consider high-efficiency panels for the southwest section to maximize production in that area.",
        "Adding one more panel to the southern section could increase production by approximately 5%."
      ]
    },
    layoutImage: {
      description: "The panels should be arranged in a symmetrical pattern with two rows of 6 panels (2x6) on the main southern roof face, with a gap around the chimney. The southwest-facing section should have another 2x6 arrangement of panels positioned toward the bottom edge of the roof for optimal sun exposure and to minimize shading."
    },
    specifications: {
      panelType: "REC Alpha Pure 400W (21.7% efficiency, 1.85m² area per panel)",
      inverterRecommendation: "SolarEdge HD-Wave SE7600H with power optimizers",
      mountingHardware: "IronRidge XR1000 with FlashFoot anchors"
    }
  });
} 