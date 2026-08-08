import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, calamityType } = body;

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "Text is required for enhancement." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        const prompt = `
You are an expert agricultural claims assistant in India. A farmer has provided a rough, scattered description of crop damage caused by "${calamityType}".
Your task is to rewrite and "brush up" this description into a clear, formal, and professional insurance claim statement. 
Keep the facts intact. Do not invent new facts. Improve grammar, structure, and professional tone suitable for the Pradhan Mantri Fasal Bima Yojana (PMFBY).

Original rough text from farmer:
"${text}"

Provide ONLY the enhanced rewritten text. No markdown formatting, no conversational filler.
`;

        const result = await model.generateContent(prompt);
        const enhancedText = result.response.text().trim();

        return NextResponse.json({ enhancedText }, { status: 200 });
    } catch (err: any) {
        console.error("AI Brush Up Error:", err);
        return NextResponse.json({ error: err.message || "Failed to enhance text" }, { status: 500 });
    }
}
