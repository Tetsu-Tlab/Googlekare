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

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileName = file.name;

    try {
        let events = [];

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
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csv = xlsx.utils.sheet_to_csv(worksheet);
            events = await parseScheduleWithGeminiText(csv, fileName);
        } else {
            // Try text-based parsing for other types
            const text = buffer.toString("utf-8");
            events = await parseScheduleWithGeminiText(text, fileName);
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

async function parseScheduleWithGeminiText(text: string, fileName: string) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
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
