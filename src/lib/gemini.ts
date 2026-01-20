import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function parseScheduleWithGemini(
    fileData: Buffer,
    mimeType: string,
    fileName: string
) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        },
    });

    const prompt = `
以下のドキュメント（${fileName}）から、日付・予定・場所・詳細などのスケジュール情報を抽出してください。
特に、年間行事予定表のような一覧表形式の場合は、すべての行を正確に抽出してください。

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
- 日付が「月/日」形式などの場合は、現在の年度（2025年または2026年）を補完して「YYYY-MM-DD」形式にしてください。
- 出力はJSON以外のテキストを含まないでください。
`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: fileData.toString("base64"),
                mimeType: mimeType,
            },
        },
    ]);

    const response = await result.response;
    const text = response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("JSON parse error:", text);
        throw new Error("Geminiからのレスポンスを解析できませんでした。");
    }
}
