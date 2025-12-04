import React from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Task, TaskStatus, Quadrant, PickleSize } from '../types';

interface DashboardProps {
    tasks: Task[];
    deepWorkMinutes: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, deepWorkMinutes }) => {
    // 1. Calculate Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const rockCount = tasks.filter(t => t.pickleSize === PickleSize.ROCK).length;
    const pebbleCount = tasks.filter(t => t.pickleSize === PickleSize.PEBBLE).length;
    const sandCount = tasks.filter(t => t.pickleSize === PickleSize.SAND).length;

    // Data for Pickle Jar
    const pickleData = [
        { name: 'Đá tảng (Lớn)', value: rockCount, color: '#ef4444' }, // Red
        { name: 'Sỏi (Vừa)', value: pebbleCount, color: '#3b82f6' },   // Blue
        { name: 'Cát (Nhỏ)', value: sandCount, color: '#94a3b8' },    // Gray
    ];

    // Data for Eisenhower
    const eisenhowerData = [
        { name: 'Làm ngay', value: tasks.filter(t => t.quadrant === Quadrant.Q1).length, color: '#fca5a5' },
        { name: 'Lên lịch', value: tasks.filter(t => t.quadrant === Quadrant.Q2).length, color: '#93c5fd' },
        { name: 'Giao việc', value: tasks.filter(t => t.quadrant === Quadrant.Q3).length, color: '#fcd34d' },
        { name: 'Xóa bỏ', value: tasks.filter(t => t.quadrant === Quadrant.Q4).length, color: '#d1d5db' },
    ];

    // Mock Weekly Performance Data
    const weeklyData = [
        { day: 'T2', score: 30 },
        { day: 'T3', score: 45 },
        { day: 'T4', score: 20 },
        { day: 'T5', score: 60 },
        { day: 'T6', score: 80 },
        { day: 'T7', score: 10 },
        { day: 'CN', score: 10 },
    ];

    const deepWorkHours = Math.floor(deepWorkMinutes / 60);
    const deepWorkMinsRem = deepWorkMinutes % 60;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+1% better</span>
                    </div>
                    <div className="text-gray-500 text-xs font-bold uppercase">Hoàn thành</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">{completionRate}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <div className="text-gray-500 text-xs font-bold uppercase">Giờ tập trung (Deep Work)</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">{deepWorkHours} <span className="text-lg text-gray-400">h</span> {deepWorkMinsRem} <span className="text-lg text-gray-400">m</span></div>
                    <div className="text-xs text-gray-400 mt-2">Dựa trên thời gian task Q2</div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <div className="text-gray-500 text-xs font-bold uppercase">Đá tảng (Việc lớn)</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">{rockCount} <span className="text-lg text-gray-400">/ 3</span></div>
                     <div className="text-xs text-gray-400 mt-2">Mục tiêu quan trọng nhất ngày</div>
                </div>

                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                    <div className="text-gray-500 text-xs font-bold uppercase">Điểm hiệu suất</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">78</div>
                    <div className="text-xs text-gray-400 mt-2">Tổng hợp từ các chỉ số</div>
                </div>
            </div>

            {/* Middle Section: Eisenhower & Pickle Jar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Eisenhower Analysis */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                        Phân tích Ma trận Eisenhower
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {eisenhowerData.map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border-l-4 ${idx === 0 ? 'bg-red-50 border-red-500' : idx === 1 ? 'bg-blue-50 border-blue-500' : idx === 2 ? 'bg-amber-50 border-amber-500' : 'bg-gray-50 border-gray-400'}`}>
                                <div className={`font-bold text-sm ${idx === 0 ? 'text-red-700' : idx === 1 ? 'text-blue-700' : idx === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                                    {idx === 0 ? '🔥 Làm ngay (Q1)' : idx === 1 ? '📅 Lên kế hoạch (Q2)' : idx === 2 ? '🤝 Giao việc (Q3)' : '🗑️ Xóa bỏ (Q4)'}
                                </div>
                                <div className="text-2xl font-bold mt-2 text-gray-800">{item.value} <span className="text-sm font-normal text-gray-500">tasks</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pickle Jar Donut */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="font-bold text-gray-700 mb-2 w-full text-left">Hũ dưa chua (Tỷ trọng)</h3>
                    <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pickleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pickleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                             <span className="text-xs font-bold text-gray-500">Pickle Jar</span>
                        </div>
                    </div>
                    <div className="w-full mt-4 space-y-2">
                        {pickleData.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: d.color}}></div>
                                    <span className="text-gray-600">{d.name}</span>
                                </div>
                                <span className="font-bold text-gray-800">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-700 mb-6">Xu hướng hiệu suất tuần</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip />
                                <Area type="monotone" dataKey="score" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-6">Dòng thời gian dự án</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg">
                        Tất cả công việc đã hoàn thành!
                    </div>
                 </div>
            </div>
        </div>
    );
};
