import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

interface RequestBody {
  plotName: string;
  state: string;
  city: string;
  pincode: string;
  areaAcres: number;
  paddyType: string;
  growthStage: string;
  moisture: number;
  temperature: number;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      plotName,
      state,
      city,
      pincode,
      areaAcres,
      paddyType,
      growthStage,
      moisture,
      temperature,
      notes,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is not configured." }, { status: 500 });
    }

    const systemPrompt = `
You are an expert AgriTech consultant specializing in Indian agriculture, crop yield forecasting, and soil management.
Calculate and predict the crop yield, market value, and agronomic recommendations for an Indian farmer's plot with these details:
- Plot Name: ${plotName}
- Location: ${city}, ${state}, India (Pincode: ${pincode})
- Farm Area: ${areaAcres} Acres
- Crop Selected: ${paddyType}
- Current Growth Stage: ${growthStage}
- Soil Moisture: ${moisture.toFixed(0)}%
- Soil Temperature: ${temperature.toFixed(0)}°C
- Farmer's Observations: ${notes || "None"}

Please calculate standard yield values typical of ${paddyType} in ${state}, India:
1. Expected Yield Range in Quintals (1 Quintal = 100 kg) and Kilograms (kg). (Note: Rice yield is typically 15-25 Quintals/Acre, Wheat is 12-20 Quintals/Acre, Sugarcane is 300-400 Quintals/Acre).
2. Expected Market Value (₹ INR) based on the latest 2025/2026 Minimum Support Price (MSP) or mandi rates in ${state}.
3. Simple Soil Status ("Optimal" | "Sub-optimal" | "Critical") based on the Moisture of ${moisture}% and Temperature of ${temperature}°C.
4. Suggestions for alternative crop rotation, intercropping, or next-season crops suitable for this plot (e.g. planting pulses after rice).
5. Action plan steps: 3-5 simple, plain English/Hinglish-friendly clear sentences for fertilizer application, watering, or crop care.

You must return a JSON object matching this schema exactly:
{
  "estimatedYieldMinKg": number,
  "estimatedYieldMaxKg": number,
  "estimatedYieldMinQuintals": number,
  "estimatedYieldMaxQuintals": number,
  "marketValueMinRs": number,
  "marketValueMaxRs": number,
  "mspRatePerQuintal": number,
  "soilStatus": "Optimal" | "Sub-optimal" | "Critical",
  "soilAnalysis": "string explaining moisture and temperature health",
  "cropRotationSuggestions": "string suggesting other agricultural choices, intercropping or rotation",
  "actionPlanSummary": "string summarizing current outlook",
  "actionPlanSteps": ["string", "string", "string"]
}
`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();
      const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(jsonString);

      return NextResponse.json(parsed);
    } catch (llmError) {
      console.error("Gemini SDK call failed, using fallback calculations:", llmError);
    }

    // Standard fallback logic using Indian crop defaults
    const baseMsp: Record<string, number> = {
      "Rice (Paddy)": 2300,
      "Basmati Rice": 4500,
      Wheat: 2275,
      Maize: 2090,
      Sugarcane: 340,
      Cotton: 6620,
      Mustard: 5650,
      Bajra: 2500,
      Ragi: 3846,
    };

    const yieldPerAcre: Record<string, number> = {
      "Rice (Paddy)": 18,
      "Basmati Rice": 15,
      Wheat: 16,
      Maize: 20,
      Sugarcane: 350,
      Cotton: 8,
      Mustard: 7,
      Bajra: 10,
      Ragi: 12,
    };

    const rate = baseMsp[paddyType] || 2000;
    const expectedYield = yieldPerAcre[paddyType] || 15;
    const minQ = Math.max(1, expectedYield * areaAcres * 0.9);
    const maxQ = expectedYield * areaAcres * 1.1;

    const fallbackResponse = {
      estimatedYieldMinKg: Math.round(minQ * 100),
      estimatedYieldMaxKg: Math.round(maxQ * 100),
      estimatedYieldMinQuintals: Number(minQ.toFixed(1)),
      estimatedYieldMaxQuintals: Number(maxQ.toFixed(1)),
      marketValueMinRs: Math.round(minQ * rate),
      marketValueMaxRs: Math.round(maxQ * rate),
      mspRatePerQuintal: rate,
      soilStatus: moisture < 30 ? "Sub-optimal" : "Optimal",
      soilAnalysis: `Live plot readings show ${moisture}% moisture and ${temperature}°C temperature. Keep water levels regulated.`,
      cropRotationSuggestions: `After harvesting ${paddyType}, consider sowing Black Gram (Urad) or Chickpeas (Chana) to enrich soil Nitrogen content naturally.`,
      actionPlanSummary: `Standard yield forecast for ${areaAcres} Acres of ${paddyType}.`,
      actionPlanSteps: [
        "Regulate irrigation based on growth stage to maintain ideal moisture.",
        "Apply fertilizers in split doses as per regional package of practices.",
        "Monitor crop regularly for common local pests and diseases.",
      ],
    };

    return NextResponse.json(fallbackResponse);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}