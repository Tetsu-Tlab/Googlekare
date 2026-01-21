import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: "GEMINI_API_KEY is not set in environment variables"
            }, { status: 500 });
        }

        // APIキーの最初と最後の数文字だけ表示（セキュリティのため）
        const keyPreview = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;

        const genAI = new GoogleGenerativeAI(apiKey);

        // シンプルなテスト - models/gemini-pro を試す
        const modelNames = ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
        const results: any[] = [];

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("こんにちは");
                const response = await result.response;
                const text = response.text();

                results.push({
                    model: modelName,
                    status: "success",
                    response: text.substring(0, 100) // 最初の100文字だけ
                });
            } catch (error: any) {
                results.push({
                    model: modelName,
                    status: "error",
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            apiKeyPreview: keyPreview,
            results: results
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
