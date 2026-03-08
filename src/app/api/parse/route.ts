import { NextRequest, NextResponse } from "next/server";
import { parseScheduleWithGemini } from "@/lib/gemini";
import mammoth from "mammoth";
import * as xlsx from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const aiEnabled = formData.get("aiEnabled") !== "false";

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileName = file.name;

    try {
        let events = [];

        if (!aiEnabled) {
            // ── AI OFF: テキスト抽出 + 正規表現パース ─────────────
            let text = "";
            if (mimeType === "application/pdf") {
                const pdfParse = (await import("pdf-parse")).default;
                const parsed = await pdfParse(buffer);
                text = parsed.text;
            } else if (
                mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
                const { value } = await mammoth.extractRawText({ buffer });
                text = value;
            } else if (
                mimeType ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) {
                const workbook = xlsx.read(buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                text = xlsx.utils.sheet_to_csv(sheet);
            } else {
                text = buffer.toString("utf-8");
            }
            events = parseWithoutAI(text);
        } else {
            // ── AI ON: Gemini で解析 ──────────────────────────────
            if (mimeType.includes("image") || mimeType === "application/pdf") {
                events = await parseScheduleWithGemini(buffer, mimeType, fileName);
            } else if (
                mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
                const { value: text } = await mammoth.extractRawText({ buffer });
                events = await parseScheduleWithGeminiText(text, fileName);
            } else if (
                mimeType ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) {
                const workbook = xlsx.read(buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const csv = xlsx.utils.sheet_to_csv(sheet);
                events = await parseScheduleWithGeminiText(csv, fileName);
            } else {
                const text = buffer.toString("utf-8");
                events = await parseScheduleWithGeminiText(text, fileName);
            }
        }

        return NextResponse.json({ events });
    } catch (error: any) {
        console.error("Parsing error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to parse schedule" },
            { status: 500 }
        );
    }
}

// ── 正規表現ベースのパーサー（AI不使用）────────────────────────
function parseWithoutAI(text: string): any[] {
    const events: any[] = [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 日本の学年度: 4月始まり → 翌年3月まで
    // 現在の月が1-3なら今年度の開始年は前年
    const fiscalYear = currentMonth <= 3 ? currentYear - 1 : currentYear;

    const pad = (n: number) => String(n).padStart(2, "0");

    // 時刻パターン HH:mm または H:mm
    const timePattern = /(\d{1,2}):(\d{2})/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // パターン1: YYYY/MM/DD または YYYY-MM-DD
        const fullDateMatch = line.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (fullDateMatch) {
            const date = `${fullDateMatch[1]}-${pad(Number(fullDateMatch[2]))}-${pad(Number(fullDateMatch[3]))}`;
            const times = [...line.matchAll(timePattern)];
            const startTime = times[0] ? `${pad(Number(times[0][1]))}:${times[0][2]}` : "";
            const endTime = times[1] ? `${pad(Number(times[1][1]))}:${times[1][2]}` : "";
            const title = line.replace(fullDateMatch[0], "").replace(/\d{1,2}:\d{2}/g, "").replace(/[〜~\-→]/g, "").trim() || `予定`;
            events.push({ date, startTime, endTime, title, location: "", description: "" });
            continue;
        }

        // パターン2: MM/DD 形式 (例: 4/15, 12/31)
        const mdSlashMatch = line.match(/^(\d{1,2})\/(\d{1,2})(?:\s|$|[（(【\s])/);
        if (mdSlashMatch) {
            const month = Number(mdSlashMatch[1]);
            const day = Number(mdSlashMatch[2]);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                // 学年度を考慮: 4〜3月
                const year = month >= 4 ? fiscalYear : fiscalYear + 1;
                const date = `${year}-${pad(month)}-${pad(day)}`;
                const times = [...line.matchAll(timePattern)];
                const startTime = times[0] ? `${pad(Number(times[0][1]))}:${times[0][2]}` : "";
                const endTime = times[1] ? `${pad(Number(times[1][1]))}:${times[1][2]}` : "";
                const title = line.replace(mdSlashMatch[0], "").replace(/\d{1,2}:\d{2}/g, "").trim() || `予定`;
                events.push({ date, startTime, endTime, title, location: "", description: "" });
                continue;
            }
        }

        // パターン3: MM月DD日 形式
        const jpDateMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
        if (jpDateMatch) {
            const month = Number(jpDateMatch[1]);
            const day = Number(jpDateMatch[2]);
            const year = month >= 4 ? fiscalYear : fiscalYear + 1;
            const date = `${year}-${pad(month)}-${pad(day)}`;
            const times = [...line.matchAll(timePattern)];
            const startTime = times[0] ? `${pad(Number(times[0][1]))}:${times[0][2]}` : "";
            const endTime = times[1] ? `${pad(Number(times[1][1]))}:${times[1][2]}` : "";
            const title = line.replace(jpDateMatch[0], "").replace(/\d{1,2}:\d{2}/g, "").trim() || `予定`;
            events.push({ date, startTime, endTime, title, location: "", description: "" });
        }
    }

    return events;
}

// ── Gemini テキスト解析（AI ON, テキスト系ファイル）──────────
async function parseScheduleWithGeminiText(text: string, fileName: string) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
以下のテキスト（ファイル名: ${fileName}）から、日付・予定・場所・詳細などのスケジュール情報を抽出してください。
テキストはスプレッドシートのCSV形式や文書のテキストです。

出力は必ず以下のJSON形式の配列にしてください：
[
  {
    "date": "YYYY-MM-DD",
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "title": "予定のタイトル",
    "location": "場所",
    "description": "詳細内容"
  }
]

注意点：
- 日付が「月/日」形式などの場合は、現在の年度を補完して「YYYY-MM-DD」形式にしてください。
- 出力はJSON以外のテキストを含まないでください。
`;

    const result = await model.generateContent([prompt, text]);
    const response = await result.response;
    return JSON.parse(response.text());
}
