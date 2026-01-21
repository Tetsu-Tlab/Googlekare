import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                error: "GEMINI_API_KEY is not set"
            }, { status: 500 });
        }

        // REST APIで直接モデル一覧を取得
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
                error: `API Error: ${response.status} ${response.statusText}`,
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();

        // generateContentをサポートしているモデルだけフィルタリング
        const generativeModels = data.models?.filter((model: any) =>
            model.supportedGenerationMethods?.includes('generateContent')
        ) || [];

        return NextResponse.json({
            totalModels: data.models?.length || 0,
            generativeModels: generativeModels.map((m: any) => ({
                name: m.name,
                displayName: m.displayName,
                description: m.description,
                supportedMethods: m.supportedGenerationMethods
            })),
            allModels: data.models?.map((m: any) => m.name) || []
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
