import { google } from "googleapis";

export async function addEventsToGoogleCalendar(
    accessToken: string,
    events: any[],
    calendarId: string = "primary"
) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const results = [];
    for (const event of events) {
        // デフォルトの開始時間を設定
        let startTime = event.startTime || "09:00";
        let endTime = event.endTime;

        // もし時間が「HH:mm」形式でない場合のガード
        if (!startTime.includes(":")) startTime = "09:00";

        const startDateTimeStr = `${event.date}T${startTime}:00`;
        let endDateTimeStr;

        if (endTime && endTime.includes(":") && endTime > startTime) {
            // 正常な終了時間がある場合
            endDateTimeStr = `${event.date}T${endTime}:00`;
        } else {
            // 終了時間が未入力、または開始時間以前の場合は、1時間後をデフォルトに設定
            const hours = parseInt(startTime.split(":")[0]);
            const nextHour = (hours + 1).toString().padStart(2, "0");
            const minutes = startTime.split(":")[1];
            endDateTimeStr = `${event.date}T${nextHour}:${minutes}:00`;
        }

        const res = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: {
                summary: event.title,
                location: event.location,
                description: event.description,
                start: {
                    dateTime: startDateTimeStr,
                    timeZone: "Asia/Tokyo",
                },
                end: {
                    dateTime: endDateTimeStr,
                    timeZone: "Asia/Tokyo",
                },
            },
        });
        results.push(res.data);
    }

    return results;
}
