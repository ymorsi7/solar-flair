import fs from "fs/promises";
import genAI from "@google/generative-ai";

export interface VisionOut {
  usableAreaM2: number;
  shadePct: number;
}

const model = genAI.getGenerativeModel({ model:"gemini-1.5-pro-vision" });

export async function roofVision(pngPath:string): Promise<VisionOut>{
  const bytes   = await fs.readFile(pngPath);
  const base64  = bytes.toString("base64");

  const res = await model.generateContent({
    contents:[{
      role:"user",
      parts:[
        {inlineData:{mimeType:"image/png",data:base64}},
        {text:"Return JSON {usable_area_m2, shade_pct} for solar panel placement"}
      ]
    }],
    tools:[{
      functionDeclaration:{
        name:"roofReport",
        parameters:{type:"object",
          properties:{
            usable_area_m2:{type:"number"},
            shade_pct:{type:"number"}
          },
          required:["usable_area_m2","shade_pct"]
        }
      }
    }]
  });

  return JSON.parse(res.candidates[0].content.parts[0].text);
}
