"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onParsed: (events: any[]) => void;
}

export function FileUpload({ onParsed }: FileUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/parse", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            onParsed(data.events);
        } catch (err: any) {
            setError(err.message || "ファイルの解析に失敗しました。");
        } finally {
            setLoading(false);
        }
    }, [onParsed]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
        multiple: false,
    });

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out",
                    isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
                    loading && "pointer-events-none opacity-60"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className={cn(
                        "p-4 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors",
                        isDragActive && "bg-blue-100"
                    )}>
                        {loading ? (
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">
                            {loading ? "AI 解析中..." : "ファイルをアップロード"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            ドラッグ＆ドロップまたはクリックして選択
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, PDF, Word, Excel (最大 10MB)
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
