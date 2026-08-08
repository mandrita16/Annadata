import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the application environment." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    // 1. Initialize Gemini 2.5 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // 2. Format image part for Gemini multimodal request
    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type || "image/jpeg",
      },
    };

    // 3. Prompt Gemini for real-time visual crop leaf diagnostics
    const prompt = `
You are an expert precision agricultural phytopathologist and plant vision diagnostic agent for the "Tatva" smart farming platform.
Analyze this uploaded crop leaf image. Inspect the leaf for spots, lesions, fungal growth, structural wilts, or nutritional deficiencies.

Provide a highly specific, sensible, and realistic agricultural diagnosis of what disease or stress is affecting the leaf. If the leaf is completely healthy, report no disease.

Return your diagnostic results in a strictly formatted JSON object (NO markdown, NO codeblocks, JUST valid JSON). Ensure the object matches this schema:

{
  "found": <boolean: true if a disease/stress is found, false if completely healthy>,
  "diseaseName": "<Name of the detected crop disease, e.g., 'Tomato Late Blight' or 'Rice Blast', or 'None' if healthy>",
  "severity": "<String describing leaf damage severity, e.g., 'High (72% Coverage)' or 'None' if healthy>",
  "confidence": <Float between 0.0 and 1.0 representing your diagnostic confidence>,
  "description": "<A 2-3 sentence pathological explanation of how the disease is affecting the leaf cells, its transmission channels, and visible markers>",
  "quickFix": "<Immediate control actions, chemical spray recommendations, or cultural practices to halt the spread immediately>",
  "weeklyPlan": [
    {
      "week": "Week 1: <Focus of Week 1>",
      "medication": "<Fungicide, pesticide, or nutrient fertilizer recommendation>",
      "dosage": "<Recommended acreage dose, e.g., '120g dissolved in 200L water'>",
      "instructions": "<Precise application instructions and field guidelines for the farmer>"
    },
    ... (generate a robust 4-week recovery timeline of treatments. If healthy, generate 2 weeks of routine preventative tips)
  ]
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Parse and return the AI JSON response
    const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const aiData = JSON.parse(jsonString);

    return NextResponse.json({
      ...aiData,
      inputImage: base64Image,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
