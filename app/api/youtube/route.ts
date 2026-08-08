import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is not configured." }, { status: 500 });
    }

    // Call YouTube search endpoint
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query,
    )}&key=${apiKey}&type=video&maxResults=4`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("YouTube API error response:", errorText);
      return NextResponse.json({ error: "YouTube search request failed." }, { status: res.status });
    }

    const data = await res.json();
    const videos = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (err: any) {
    console.error("YouTube search error:", err);
    return NextResponse.json({ error: err.message || "Unknown YouTube search error" }, { status: 500 });
  }
}
