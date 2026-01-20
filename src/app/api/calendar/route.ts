import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { addEventsToGoogleCalendar } from "@/lib/calendar";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { events } = await req.json();

    if (!events || !Array.isArray(events)) {
        return NextResponse.json({ error: "Invalid events data" }, { status: 400 });
    }

    try {
        const results = await addEventsToGoogleCalendar(session.accessToken, events);
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Calendar integration error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to add events to calendar" },
            { status: 500 }
        );
    }
}
