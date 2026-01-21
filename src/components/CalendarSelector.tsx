"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Check } from "lucide-react";

interface CalendarOption {
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    primary: boolean;
}

interface CalendarSelectorProps {
    selectedCalendarId: string;
    onSelect: (calendarId: string) => void;
}

export function CalendarSelector({ selectedCalendarId, onSelect }: CalendarSelectorProps) {
    const { data: session } = useSession();
    const [calendars, setCalendars] = useState<CalendarOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (session) {
            fetchCalendars();
        }
    }, [session]);

    const fetchCalendars = async () => {
        try {
            const res = await fetch("/api/calendars");
            const data = await res.json();
            if (data.calendars) {
                setCalendars(data.calendars);
                // デフォルトでプライマリカレンダーを選択
                const primary = data.calendars.find((cal: CalendarOption) => cal.primary);
                if (primary && !selectedCalendarId) {
                    onSelect(primary.id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch calendars:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId);

    if (loading) {
        return (
            <div className="text-sm text-gray-500">
                カレンダーを読み込み中...
            </div>
        );
    }

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                登録先カレンダー
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                        {selectedCalendar?.summary || "カレンダーを選択"}
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {calendars.map((calendar) => (
                        <button
                            key={calendar.id}
                            onClick={() => {
                                onSelect(calendar.id);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: calendar.backgroundColor || "#4285f4" }}
                                />
                                <div className="text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {calendar.summary}
                                        {calendar.primary && (
                                            <span className="ml-2 text-xs text-blue-600">(メイン)</span>
                                        )}
                                    </div>
                                    {calendar.description && (
                                        <div className="text-xs text-gray-500">{calendar.description}</div>
                                    )}
                                </div>
                            </div>
                            {calendar.id === selectedCalendarId && (
                                <Check className="w-5 h-5 text-blue-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
