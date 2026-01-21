"use client";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import { Calendar as CalendarIcon, MapPin, AlignLeft, Clock, CheckSquare, Square } from "lucide-react";
import { useState, useEffect } from "react";

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
    onSave: (selectedEvents: Event[]) => void;
    saving: boolean;
}

const columnHelper = createColumnHelper<Event>();

export function EventTable({ data, onUpdate, onSave, saving }: EventTableProps) {
    const [editedData, setEditedData] = useState(data);
    const [rowSelection, setRowSelection] = useState({});

    useEffect(() => {
        setEditedData(data);
        // Default select all when data changes
        const selection: Record<string, boolean> = {};
        data.forEach((_, index) => {
            selection[index] = true;
        });
        setRowSelection(selection);
    }, [data]);

    const handleCellChange = (rowIndex: number, columnId: string, value: string) => {
        const newData = [...editedData];
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
        setEditedData(newData);
        onUpdate(newData);
    };

    const columns = [
        {
            id: "select",
            header: ({ table }: any) => (
                <button
                    onClick={table.getToggleAllRowsSelectedHandler()}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title={table.getIsAllRowsSelected() ? "全選択解除" : "全選択"}
                >
                    {table.getIsAllRowsSelected() ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                    )}
                </button>
            ),
            cell: ({ row }: any) => (
                <button
                    onClick={row.getToggleSelectedHandler()}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                    {row.getIsSelected() ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                    )}
                </button>
            ),
        },
        columnHelper.accessor("date", {
            header: () => <div className="flex items-center gap-2 text-nowrap"><CalendarIcon className="w-4 h-4" /> 日付</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "date", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("startTime", {
            header: () => <div className="flex items-center gap-2 text-nowrap"><Clock className="w-4 h-4" /> 開始</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "startTime", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("title", {
            header: () => <div className="text-nowrap">予定名</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "title", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("location", {
            header: () => <div className="flex items-center gap-2 text-nowrap"><MapPin className="w-4 h-4" /> 場所</div>,
            cell: (info) => (
                <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm"
                    value={info.getValue()}
                    onChange={(e) => handleCellChange(info.row.index, "location", e.target.value)}
                />
            ),
        }),
        columnHelper.accessor("description", {
            header: () => <div className="flex items-center gap-2 text-nowrap"><AlignLeft className="w-4 h-4" /> 詳細</div>,
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
        state: {
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
    });

    const selectedCount = Object.keys(rowSelection).length;

    const handleSaveClick = () => {
        const selectedEvents = table.getSelectedRowModel().rows.map(row => row.original);
        onSave(selectedEvents);
    };

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
                            <tr
                                key={row.id}
                                className={`transition-colors ${row.getIsSelected() ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                            >
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

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500 font-medium">
                    {selectedCount} 件の予定を選択中 / 全 {data.length} 件
                </div>
                <button
                    onClick={handleSaveClick}
                    disabled={saving || selectedCount === 0}
                    className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-nowrap"
                >
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    選択した {selectedCount} 件をカレンダーに登録
                </button>
            </div>
        </div>
    );
}
