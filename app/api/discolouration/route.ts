import { NextRequest, NextResponse } from "next/server";
import sharp, { Sharp } from "sharp";

export const runtime = "nodejs";

interface AnalysisStats {
    totalPixels: number;
    healthyPixels: number;
    stressedPixels: number;
    emptyPixels: number;
    healthyPercent: number;
    stressedPercent: number;
    emptyPercent: number;
    healthyAreaM2?: number;
    stressedAreaM2?: number;
    emptyAreaM2?: number;
}

interface AnalysisResult {
    stats: AnalysisStats;
    overlayImage: string;
    inputImage: string;
}

const MIN_NEIGHBOURS = 3;

const HEALTHY_LOWER: [number, number, number] = [25, 40, 40];
const HEALTHY_UPPER: [number, number, number] = [90, 255, 255];
const STRESSED_YELLOW_LOWER: [number, number, number] = [15, 40, 40];
const STRESSED_YELLOW_UPPER: [number, number, number] = [35, 255, 255];
const STRESSED_BROWN_LOWER: [number, number, number] = [5, 30, 30];
const STRESSED_BROWN_UPPER: [number, number, number] = [20, 255, 200];

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const rf = r / 255, gf = g / 255, bf = b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const delta = max - min;

    let h = 0;
    if (delta > 0) {
        if (max === rf) h = 60 * (((gf - bf) / delta) % 6);
        else if (max === gf) h = 60 * ((bf - rf) / delta + 2);
        else h = 60 * ((rf - gf) / delta + 4);
        if (h < 0) h += 360;
    }

    return [
        Math.round(h / 2),
        max === 0 ? 0 : Math.round((delta / max) * 255),
        Math.round(max * 255),
    ];
}

function inRange(
    h: number, s: number, v: number,
    lower: [number, number, number],
    upper: [number, number, number]
): boolean {
    return h >= lower[0] && h <= upper[0]
        && s >= lower[1] && s <= upper[1]
        && v >= lower[2] && v <= upper[2];
}

function classifyPixels(pixels: Buffer, width: number, height: number): Uint8Array {
    const labels = new Uint8Array(width * height);

    for (let i = 0; i < width * height; i++) {
        const [h, s, v] = rgbToHsv(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]);
        if (inRange(h, s, v, HEALTHY_LOWER, HEALTHY_UPPER)) {
            labels[i] = 1;
        } else if (
            inRange(h, s, v, STRESSED_YELLOW_LOWER, STRESSED_YELLOW_UPPER) ||
            inRange(h, s, v, STRESSED_BROWN_LOWER, STRESSED_BROWN_UPPER)
        ) {
            labels[i] = 2;
        }
    }

    const cleaned = new Uint8Array(labels);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const label = labels[idx];
            if (label === 0) continue;
            let neighbours = 0;
            for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++)
                    if ((dy !== 0 || dx !== 0) && labels[(y + dy) * width + (x + dx)] === label)
                        neighbours++;
            if (neighbours < MIN_NEIGHBOURS) cleaned[idx] = 0;
        }
    }
    return cleaned;
}

function buildOverlay(original: Buffer, labels: Uint8Array, width: number, height: number): Buffer {
    const COLOR: Record<number, [number, number, number]> = {
        0: [0, 0, 200],
        1: [0, 200, 0],
        2: [220, 0, 0],
    };
    const alpha = 0.4;
    const out = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
        const [cr, cg, cb] = COLOR[labels[i]];
        out[i * 4] = Math.round(original[i * 4] * (1 - alpha) + cr * alpha);
        out[i * 4 + 1] = Math.round(original[i * 4 + 1] * (1 - alpha) + cg * alpha);
        out[i * 4 + 2] = Math.round(original[i * 4 + 2] * (1 - alpha) + cb * alpha);
        out[i * 4 + 3] = 255;
    }
    return out;
}

async function analyzeRiceField(
    imageBuffer: Buffer,
    fieldAreaM2?: number,
    gsdM?: number
): Promise<AnalysisResult> {
    const MAX_DIM = 1500;

    let img: Sharp = sharp(imageBuffer);
    const meta = await img.metadata();
    const origW = meta.width ?? 0;
    const origH = meta.height ?? 0;
    const scale = Math.min(MAX_DIM / Math.max(origW, origH), 1.0);
    const w = Math.round(origW * scale);
    const h = Math.round(origH * scale);

    if (scale < 1.0) img = img.resize(w, h, { kernel: sharp.kernel.lanczos3 });

    const { data: pixelData } = await img.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const labels = classifyPixels(pixelData, w, h);

    const totalPixels = w * h;
    let healthyPixels = 0, stressedPixels = 0;
    for (let i = 0; i < totalPixels; i++) {
        if (labels[i] === 1) healthyPixels++;
        else if (labels[i] === 2) stressedPixels++;
    }
    const emptyPixels = totalPixels - healthyPixels - stressedPixels;

    const stats: AnalysisStats = {
        totalPixels,
        healthyPixels,
        stressedPixels,
        emptyPixels,
        healthyPercent: totalPixels > 0 ? (healthyPixels / totalPixels) * 100 : 0,
        stressedPercent: totalPixels > 0 ? (stressedPixels / totalPixels) * 100 : 0,
        emptyPercent: totalPixels > 0 ? (emptyPixels / totalPixels) * 100 : 0,
    };

    if (gsdM != null) {
        const px = gsdM * gsdM;
        stats.healthyAreaM2 = healthyPixels * px;
        stats.stressedAreaM2 = stressedPixels * px;
        stats.emptyAreaM2 = emptyPixels * px;
    } else if (fieldAreaM2 != null) {
        stats.healthyAreaM2 = (healthyPixels / totalPixels) * fieldAreaM2;
        stats.stressedAreaM2 = (stressedPixels / totalPixels) * fieldAreaM2;
        stats.emptyAreaM2 = (emptyPixels / totalPixels) * fieldAreaM2;
    }

    const overlayJpeg = await sharp(buildOverlay(pixelData, labels, w, h), { raw: { width: w, height: h, channels: 4 } })
        .jpeg({ quality: 85 }).toBuffer();

    const inputJpeg = await img.clone().jpeg({ quality: 85 }).toBuffer();

    const toDataUrl = (buf: Buffer) => `data:image/jpeg;base64,${buf.toString("base64")}`;

    return {
        stats,
        overlayImage: toDataUrl(overlayJpeg),
        inputImage: toDataUrl(inputJpeg),
    };
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get("image");

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        const fieldAreaM2 = form.get("fieldAreaM2") ? Number(form.get("fieldAreaM2")) : undefined;
        const gsdM = form.get("gsdM") ? Number(form.get("gsdM")) : undefined;

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        const result = await analyzeRiceField(imageBuffer, fieldAreaM2, gsdM);

        return NextResponse.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}