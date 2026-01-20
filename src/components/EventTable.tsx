"use client";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import { Calendar as CalendarIcon, MapPin, AlignLeft, Clock } from "lucide-react";
import { useState } from "react";

interface Event {
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    location: string;
    description: string;
}

interface EventTableProps {
    data: Event[];
    onUpdate: (data: Event[]) => void;
    onSave: () => void;
    saving: boolean;
}

const columnHelper = createColumnHelper<Event>();

export function EventTable({ data, onUpdate, onSave, saving }: EventTableProps) {
    const [editedData, setEditedData] = useState(data);

    const handleCellChange = (rowIndex: number, columnId: string, value: string) => {
        const newData = [...editedData];
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
        setEditedData(newData);
        onUpdate(newData);
    };

    const columns = [
        columnHelper.accessor("date", {
            header: () => <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> 日付</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "date", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("startTime", {
            header: () => <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 開始</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "startTime", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("title", {
            header: () => "予定名",
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "title", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("location", {
            header: () => <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 場所</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "location", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("description", {
            header: () => <div className="flex items-center gap-2"><AlignLeft className="w-4 h-4" /> 詳細</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "description", e.target.value)}
                />
            ),
        }),
    ];

    const table = useReactTable({
        data: editedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-hidden flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="bg-gray-50 border-b border-gray-200">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onSave}
                    disabled={saving || editedData.length === 0}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Googleカレンダーに一括登録
                </button>
            </div>
        </div>
    );
}
