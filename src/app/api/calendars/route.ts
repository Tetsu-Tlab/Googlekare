import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: session.accessToken });

        const calendar = google.calendar({ version: "v3", auth });

        const response = await calendar.calendarList.list();

        const calendars = response.data.items?.map((cal) => ({
            id: cal.id,
            summary: cal.summary,
            description: cal.description,
            backgroundColor: cal.backgroundColor,
            primary: cal.primary || false,
        })) || [];

        return NextResponse.json({ calendars });
    } catch (error: any) {
        console.error("Calendar list error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch calendars" },
            { status: 500 }
        );
    }
}
