import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, languageCode = "en-US" } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is not configured." }, { status: 500 });
    }

    // Select the best voice name for the requested language code
    let voiceName = "en-IN-Wavenet-A"; // Default to Indian English
    let actualLang = languageCode;

    if (languageCode.startsWith("hi")) {
      actualLang = "hi-IN";
      voiceName = "hi-IN-Wavenet-A";
    } else if (languageCode.startsWith("mr")) {
      actualLang = "mr-IN";
      voiceName = "mr-IN-Wavenet-A";
    } else if (languageCode.startsWith("ta")) {
      actualLang = "ta-IN";
      voiceName = "ta-IN-Wavenet-A";
    } else if (languageCode.startsWith("bn")) {
      actualLang = "bn-IN";
      voiceName = "bn-IN-Wavenet-A";
    } else if (languageCode.startsWith("en")) {
      actualLang = "en-IN";
      voiceName = "en-IN-Wavenet-A";
    }

    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: actualLang,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Text-to-Speech API error response:", errorText);
      return NextResponse.json({ error: "Text-to-Speech request failed." }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (err: any) {
    console.error("Text-to-Speech error:", err);
    return NextResponse.json({ error: err.message || "Unknown TTS error" }, { status: 500 });
  }
}
