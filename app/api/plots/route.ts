import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Plot from "@/models/Plot";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, state, city, pincode, area, landmark } = body;

        if (!name || !state || !city || !pincode || !area || !landmark || !landmark.lat || !landmark.lng) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate name format on the backend
        if (name.length < 5 || name.length > 12 || !/^[a-zA-Z0-9]+$/.test(name)) {
            return NextResponse.json(
                { message: "Invalid plot name format. Must be 5-12 alphanumeric characters with no spaces or special characters." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const newPlot = await Plot.create({
            user: session.user.id,
            name,
            state,
            city,
            pincode,
            area,
            landmark,
        });

        return NextResponse.json(newPlot, { status: 201 });
    } catch (error: any) {
        console.error("Error creating plot:", error);
        return NextResponse.json(
            { message: "Error creating plot", error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const plots = await Plot.find({ user: session.user.id }).sort({
            createdAt: -1,
        });

        return NextResponse.json(plots, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching plots:", error);
        return NextResponse.json(
            { message: "Error fetching plots", error: error.message },
            { status: 500 }
        );
    }
}
