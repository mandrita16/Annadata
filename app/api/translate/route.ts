import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: "Text and target language are required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is not configured." }, { status: 500 });
    }

    // Support both single string and array of strings
    const queries = Array.isArray(text) ? text : [text];

    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: queries,
        target: target,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Translation API error response:", errorText);
      return NextResponse.json({ error: "Translation request failed." }, { status: res.status });
    }

    const data = await res.json();
    const translations = data?.data?.translations || [];
    const translatedTexts = translations.map((t: any) => t.translatedText);

    return NextResponse.json({
      translatedText: Array.isArray(text) ? translatedTexts : (translatedTexts[0] || text),
    });
  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message || "Unknown translation error" }, { status: 500 });
  }
}
