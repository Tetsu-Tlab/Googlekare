"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, Calendar } from "lucide-react";

export function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="glass-morphism fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Calendar className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">AI Schedule Sync</span>
                    </div>
                    <div>
                        {session ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900">{session.user?.name}</span>
                                    <span className="text-xs text-gray-500">{session.user?.email}</span>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    ログアウト
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn("google")}
                                className="flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                <LogIn className="w-4 h-4" />
                                Googleでログイン
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
