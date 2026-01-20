import { google } from "googleapis";

export async function addEventsToGoogleCalendar(
    accessToken: string,
    events: any[]
) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const results = [];
    for (const event of events) {
        const startDateTime = event.startTime
            ? `${event.date}T${event.startTime}:00`
            : `${event.date}T09:00:00`;
        const endDateTime = event.endTime
            ? `${event.date}T${event.endTime}:00`
            : `${event.date}T10:00:00`;

        const res = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: event.title,
                location: event.location,
                description: event.description,
                start: {
                    dateTime: startDateTime,
                    timeZone: "Asia/Tokyo",
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: "Asia/Tokyo",
                },
            },
        });
        results.push(res.data);
    }

    return results;
}
