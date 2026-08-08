import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/imagekit";

export async function POST(request: NextRequest) {
    try {
        if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
            return NextResponse.json(
                { error: "Missing required ImageKit configuration" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = "/Tatva";

        // Build a structured, unique filename: tatva_<timestamp>_<random>.<ext>
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const uniqueFileName = `tatva_${timestamp}_${random}.${ext}`;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload an image." },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB." },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadImage(buffer, uniqueFileName, folder);

        return NextResponse.json(uploadResult);

    } catch (error: any) {
        console.error("ImageKit upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload image to ImageKit", details: error.message },
            { status: 500 }
        );
    }
}