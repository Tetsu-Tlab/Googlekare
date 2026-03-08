"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { FileUpload } from "@/components/FileUpload";
import { EventTable } from "@/components/EventTable";
import { CalendarSelector } from "@/components/CalendarSelector";
import { useSession, signIn } from "next-auth/react";
import { Calendar, Sparkles, CheckCircle2, Zap, ZapOff, Download } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("primary");
  const [aiEnabled, setAiEnabled] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("selectedCalendarId");
    if (savedId) setSelectedCalendarId(savedId);

    const savedAi = localStorage.getItem("googlekare_ai_enabled");
    if (savedAi !== null) setAiEnabled(savedAi === "true");
  }, []);

  // Nova postMessage bridge
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.type !== "ANTIGRAVITY_SYNC") return;
      const payload = e.data.payload || {};
      if (typeof payload.aiEnabled === "boolean") {
        setAiEnabled(payload.aiEnabled);
        localStorage.setItem("googlekare_ai_enabled", String(payload.aiEnabled));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const toggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    localStorage.setItem("googlekare_ai_enabled", String(next));
    // Notify Nova
    window.parent?.postMessage(
      { type: "ANTIGRAVITY_OUTPUT", appId: "schedule-import", payload: { aiEnabled: next } },
      "*"
    );
  };

  const handleCalendarSelect = (id: string) => {
    setSelectedCalendarId(id);
    localStorage.setItem("selectedCalendarId", id);
  };

  const handleParsed = (newEvents: any[]) => {
    setEvents(newEvents);
    setSuccess(false);
  };

  const handleSave = async (eventsToSave: any[] = events, calendarId: string = selectedCalendarId) => {
    if (!session || eventsToSave.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSave, calendarId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(true);
      setEvents([]);
    } catch (err: any) {
      alert(`カレンダーへの登録に失敗しました。\n${err.message || "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  // CSV download (Google Calendar import format)
  const handleDownloadCSV = useCallback(() => {
    if (events.length === 0) return;
    const header = "Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location";
    const rows = events.map(ev => {
      const allDay = !ev.startTime ? "True" : "False";
      const startDate = ev.date || "";
      const endDate = ev.date || "";
      const startTime = ev.startTime || "";
      const endTime = ev.endTime || "";
      const escape = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      return [
        escape(ev.title),
        startDate,
        startTime,
        endDate,
        endTime,
        allDay,
        escape(ev.description),
        escape(ev.location),
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>スケジュール管理を自動化</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            スケジュール入力
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            書類や画像からスケジュールを読み取り、<br className="hidden sm:block" />
            自動でGoogleカレンダーに同期します。
          </p>
        </div>

        {/* AI Toggle */}
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={toggleAI}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              aiEnabled
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {aiEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            AI解析 {aiEnabled ? "ON" : "OFF"}
          </button>
          <p className="text-xs text-gray-400 mt-1 ml-1">
            {aiEnabled
              ? "AIがファイルの内容を解析してスケジュールを抽出します"
              : "AIなしでテキスト・日付パターンから自動抽出します（精度は下がります）"}
          </p>
        </div>

        {!session ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-50 max-w-xl mx-auto">
            <Calendar className="w-16 h-16 text-blue-100 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              まずはログインしてください
            </h2>
            <p className="text-gray-500 mb-8">
              Googleカレンダーとの同期には、Googleアカウントでのログインが必要です。
            </p>
            <button
              onClick={() => signIn("google")}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Googleでログインして始める
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {events.length === 0 ? (
              <div className="space-y-8 max-w-3xl mx-auto">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <CalendarSelector
                    selectedCalendarId={selectedCalendarId}
                    onSelect={handleCalendarSelect}
                  />
                </div>

                <FileUpload onParsed={handleParsed} aiEnabled={aiEnabled} />

                {success && (
                  <div className="p-6 bg-green-50 border border-green-100 rounded-3xl flex flex-col items-center text-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900">同期完了！</h3>
                      <p className="text-green-700">すべての予定がGoogleカレンダーに追加されました。</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">読み取り結果の確認</h2>
                    <p className="text-gray-500">
                      {aiEnabled ? "AIが抽出した内容を確認し、必要に応じて修正してください。" : "自動抽出した内容を確認し、必要に応じて修正してください。"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      CSVダウンロード
                    </button>
                  </div>
                  <div className="w-full sm:w-80">
                    <CalendarSelector
                      selectedCalendarId={selectedCalendarId}
                      onSelect={handleCalendarSelect}
                    />
                  </div>
                  <button
                    onClick={() => setEvents([])}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 underline shrink-0"
                  >
                    キャンセル
                  </button>
                </div>
                <EventTable
                  data={events}
                  onUpdate={setEvents}
                  onSave={handleSave}
                  saving={saving}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
