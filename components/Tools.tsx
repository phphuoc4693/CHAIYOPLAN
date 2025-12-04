
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Quadrant, PickleSize, YearlyGoal, Milestone } from '../types';
import { Plus, Move, AlertCircle, Check, ChevronDown, ChevronUp, Flag, X, Trash2, Calendar, Clock, AlignLeft, MoreHorizontal, Save, HelpCircle, Star, Edit2, Info, Bell, ChevronLeft, ChevronRight } from 'lucide-react';

interface ToolsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  goals: YearlyGoal[];
  setGoals: React.Dispatch<React.SetStateAction<YearlyGoal[]>>;
  mode: 'EISENHOWER' | 'RULE_5_25';
}

export const Tools: React.FC<ToolsProps> = ({ tasks, setTasks, goals, setGoals, mode }) => {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newMilestoneData, setNewMilestoneData] = useState<{title: string, start: string, end: string}>({title: '', start: '', end: ''});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Quick Add Inputs for Eisenhower Quadrants
  const [quickAddInputs, setQuickAddInputs] = useState<{ [key in Quadrant]: string }>({
      [Quadrant.Q1]: '',
      [Quadrant.Q2]: '',
      [Quadrant.Q3]: '',
      [Quadrant.Q4]: ''
  });

  // Weekly Logic for Eisenhower
  const [viewDate, setViewDate] = useState(new Date());

  // Helper to get week key "YYYY-W##"
  const getWeekKey = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const year = d.getUTCFullYear();
      const week = Math.ceil((((d.getTime() - new Date(Date.UTC(year,0,1)).getTime()) / 86400000) + 1)/7);
      return `${year}-W${week}`;
  };

  const getCurrentWeekKey = () => getWeekKey(viewDate);
  
  const getWeekRangeDisplay = () => {
      const d = new Date(viewDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(d.setDate(monday.getDate() + 6));
      return `Tuần ${getWeekKey(viewDate).split('-W')[1]} (${monday.getDate()}/${monday.getMonth()+1} - ${sunday.getDate()}/${sunday.getMonth()+1})`;
  };

  const changeWeek = (offset: number) => {
      const newDate = new Date(viewDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      setViewDate(newDate);
  };

  const currentWeekKey = getCurrentWeekKey();
  const weeklyTasks = tasks.filter(t => t.assignWeek === currentWeekKey);


  const handleUpdateTask = () => {
    if (editingTask) {
        setTasks(tasks.map(t => t.id === editingTask.id ? editingTask : t));
        setEditingTask(null);
    }
  };

  // Delete task from Modal
  const handleDeleteTask = () => {
      if (editingTask && window.confirm("Bạn có chắc muốn xóa công việc này?")) {
          setTasks(tasks.filter(t => t.id !== editingTask.id));
          setEditingTask(null);
      }
  }

  // Delete specific task directly from list (Eisenhower)
  const handleDeleteSpecificTask = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Bạn có chắc muốn xóa công việc này?")) {
          setTasks(tasks.filter(t => t.id !== id));
      }
  };

  // 5/25 Rule Logic
  const handleAddGoal = (title: string) => {
      if(goals.length >= 25) return;
      setGoals([...goals, { id: Date.now().toString(), title, isTop5: false, progress: 0, milestones: [] }]);
  };
  const toggleTop5 = (id: string) => {
      const goal = goals.find(g => g.id === id);
      const currentTop5 = goals.filter(g => g.isTop5).length;
      if (!goal?.isTop5 && currentTop5 >= 5) {
          alert("Bạn chỉ được chọn tối đa 5 mục tiêu 'Tuyệt vời'!");
          return;
      }
      setGoals(goals.map(g => g.id === id ? { ...g, isTop5: !g.isTop5 } : g));
  };

  const addTask = (title: string, quadrant: Quadrant, pickleSize: PickleSize) => {
      setTasks([...tasks, {
          id: Date.now().toString(),
          title,
          status: TaskStatus.TODO,
          quadrant,
          pickleSize,
          moscow: 'SHOULD',
          assignWeek: currentWeekKey // Assign to currently selected week
      }]);
  };

  // Handle Quick Add in Matrix
  const handleQuickAdd = (quadrant: Quadrant) => {
      const title = quickAddInputs[quadrant].trim();
      if (!title) return;
      
      addTask(title, quadrant, PickleSize.SAND); // Default to SAND size
      setQuickAddInputs({ ...quickAddInputs, [quadrant]: '' });
  };

  const handleInputChange = (quadrant: Quadrant, value: string) => {
      setQuickAddInputs({ ...quickAddInputs, [quadrant]: value });
  };

  // Milestone Logic
  const handleAddMilestone = (goalId: string) => {
      if(!newMilestoneData.title || !newMilestoneData.start || !newMilestoneData.end) {
          alert("Vui lòng nhập đầy đủ thông tin giai đoạn!");
          return;
      }
      setGoals(goals.map(g => {
          if(g.id !== goalId) return g;
          const newMilestone: Milestone = {
              id: Date.now().toString(),
              title: newMilestoneData.title,
              isCompleted: false,
              startDate: newMilestoneData.start,
              deadline: newMilestoneData.end
          };
          const updatedMilestones = [...(g.milestones || []), newMilestone];
          const completed = updatedMilestones.filter(m => m.isCompleted).length;
          const progress = Math.round((completed / updatedMilestones.length) * 100);
          return { ...g, milestones: updatedMilestones, progress };
      }));
      setNewMilestoneData({title: '', start: '', end: ''});
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
      setGoals(goals.map(g => {
          if(g.id !== goalId) return g;
          const updatedMilestones = (g.milestones || []).map(m => 
              m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
          );
          const completed = updatedMilestones.filter(m => m.isCompleted).length;
          const progress = Math.round((completed / updatedMilestones.length) * 100);
          return { ...g, milestones: updatedMilestones, progress };
      }));
  };

  const deleteMilestone = (goalId: string, milestoneId: string) => {
    setGoals(goals.map(g => {
        if(g.id !== goalId) return g;
        const updatedMilestones = (g.milestones || []).filter(m => m.id !== milestoneId);
        const completed = updatedMilestones.filter(m => m.isCompleted).length;
        const progress = updatedMilestones.length > 0 ? Math.round((completed / updatedMilestones.length) * 100) : 0;
        return { ...g, milestones: updatedMilestones, progress };
    }));
  };

  const getOverdueMilestone = (milestones: Milestone[] | undefined) => {
      if(!milestones) return null;
      const today = new Date().toISOString().split('T')[0];
      return milestones.find(m => !m.isCompleted && m.deadline && m.deadline < today);
  };

  // Improved Logic for Month Grid
  const getMonthInfo = (monthIdx: number, milestones: Milestone[] | undefined) => {
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, monthIdx, 1);
    const monthEnd = new Date(currentYear, monthIdx + 1, 0);
    const today = new Date();
    today.setHours(0,0,0,0);

    const activeMilestones = milestones?.filter(m => {
        if (!m.startDate || !m.deadline) return false;
        const start = new Date(m.startDate);
        const end = new Date(m.deadline);
        // Check intersection
        return start <= monthEnd && end >= monthStart;
    }) || [];

    let status = 'NONE';
    let color = 'bg-gray-50 border-gray-100'; // Default: Empty/Future
    let tooltip = `Tháng ${monthIdx + 1}`;

    if (activeMilestones.length > 0) {
        // Determine the most critical status for this month
        const hasOverdue = activeMilestones.some(m => !m.isCompleted && m.deadline && new Date(m.deadline) < today);
        const allCompleted = activeMilestones.every(m => m.isCompleted);
        const hasActive = activeMilestones.some(m => !m.isCompleted);

        if (allCompleted) {
            status = 'COMPLETED';
            color = 'bg-green-500 border-green-600 shadow-sm';
        } else if (hasOverdue) {
            status = 'OVERDUE';
            color = 'bg-red-500 border-red-600 animate-pulse shadow-md ring-2 ring-red-200';
        } else if (hasActive) {
            status = 'DOING';
            color = 'bg-blue-500 border-blue-600 shadow-sm';
        } else {
            status = 'PLANNED';
            color = 'bg-gray-300 border-gray-400';
        }
        
        tooltip = activeMilestones.map(m => {
            let st = 'Đang làm';
            if (m.isCompleted) st = 'Hoàn thành';
            else if (m.deadline && new Date(m.deadline) < today) st = 'Quá hạn';
            return `${m.title} (${st})`;
        }).join(', ');
    }

    // Highlight current month with a distinct border or marker if it's not already highlighted by status
    const isCurrentMonth = today.getMonth() === monthIdx && today.getFullYear() === currentYear;
    
    return { status, color, activeMilestones, tooltip, isCurrentMonth };
  };

  // Helper for milestone status text
  const getMilestoneStatus = (m: Milestone) => {
      const today = new Date().toISOString().split('T')[0];
      if (m.isCompleted) return { text: 'Hoàn thành', color: 'text-green-600 bg-green-50 border-green-200' };
      if (m.deadline && m.deadline < today) return { text: 'Quá hạn', color: 'text-red-600 bg-red-50 border-red-200' };
      if (m.startDate && m.startDate > today) return { text: 'Sắp tới', color: 'text-gray-500 bg-gray-100 border-gray-200' };
      return { text: 'Đang làm', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  // Helper to render tasks in Eisenhower Matrix
  const renderEisenhowerTasks = (quadrantTasks: Task[], borderColor: string, hoverColor: string) => {
      return (
          <div className="flex-1 overflow-auto space-y-2 pr-1 custom-scrollbar">
              {quadrantTasks.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setEditingTask(t)}
                    className={`bg-white p-3 rounded shadow-sm text-sm border-l-4 ${borderColor} group hover:shadow-md transition-all cursor-pointer flex justify-between items-center relative`}
                  >
                      <div className="flex-1 pr-2">
                        <span className="font-medium text-gray-800">{t.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            className="text-gray-400 hover:text-blue-600"
                            title="Chỉnh sửa"
                         >
                             <Edit2 size={14} />
                         </button>
                         <button 
                            onClick={(e) => handleDeleteSpecificTask(e, t.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Xóa"
                         >
                             <Trash2 size={14} />
                         </button>
                      </div>
                  </div>
              ))}
              {quadrantTasks.length === 0 && (
                  <div className="text-center text-gray-300 italic text-xs py-4">Chưa có công việc tuần này</div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-transparent relative">
        
        {/* EISENHOWER */}
        {mode === 'EISENHOWER' && (
            <div>
                {/* Week Navigator */}
                <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <div className="font-bold text-lg text-indigo-700">{getWeekRangeDisplay()}</div>
                        <div className="text-xs text-gray-400">Chỉ hiển thị công việc trong tuần này</div>
                    </div>
                    <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
                    {/* Q1 */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col hover:border-red-300 transition-colors">
                        <div className="flex justify-between mb-2 items-center">
                            <span className="font-bold text-red-700 flex items-center group relative cursor-help select-none">
                                <AlertCircle size={18} className="mr-2"/> 
                                Làm ngay (Q1)
                                <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-10 font-normal leading-relaxed">
                                    <strong>Khẩn cấp & Quan trọng.</strong><br/>Những việc cần giải quyết ngay lập tức.
                                    <div className="absolute bottom-full left-4 -mb-1 border-4 border-transparent border-b-gray-800"></div>
                                </div>
                            </span>
                        </div>
                        {/* Inline Add Input */}
                        <div className="flex items-center mb-3 bg-white p-1 rounded border border-red-200">
                            <input 
                                className="flex-1 text-xs px-2 py-1 outline-none"
                                placeholder="Thêm việc..."
                                value={quickAddInputs[Quadrant.Q1]}
                                onChange={(e) => handleInputChange(Quadrant.Q1, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(Quadrant.Q1)}
                            />
                            <button onClick={() => handleQuickAdd(Quadrant.Q1)} className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200">
                                <Plus size={16}/>
                            </button>
                        </div>
                        {renderEisenhowerTasks(weeklyTasks.filter(t => t.quadrant === Quadrant.Q1), "border-red-500", "hover:bg-red-50")}
                    </div>

                    {/* Q2 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col hover:border-blue-300 transition-colors">
                        <div className="flex justify-between mb-2 items-center">
                            <span className="font-bold text-blue-700 flex items-center group relative cursor-help select-none">
                                <Flag size={18} className="mr-2"/> 
                                Lên lịch (Q2)
                                <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-10 font-normal leading-relaxed">
                                    <strong>Quan trọng & Không khẩn cấp.</strong><br/>Giá trị dài hạn (học tập, lập kế hoạch).
                                    <div className="absolute bottom-full left-4 -mb-1 border-4 border-transparent border-b-gray-800"></div>
                                </div>
                            </span>
                        </div>
                        {/* Inline Add Input */}
                        <div className="flex items-center mb-3 bg-white p-1 rounded border border-blue-200">
                            <input 
                                className="flex-1 text-xs px-2 py-1 outline-none"
                                placeholder="Thêm việc..."
                                value={quickAddInputs[Quadrant.Q2]}
                                onChange={(e) => handleInputChange(Quadrant.Q2, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(Quadrant.Q2)}
                            />
                            <button onClick={() => handleQuickAdd(Quadrant.Q2)} className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200">
                                <Plus size={16}/>
                            </button>
                        </div>
                        {renderEisenhowerTasks(weeklyTasks.filter(t => t.quadrant === Quadrant.Q2), "border-blue-500", "hover:bg-blue-50")}
                    </div>

                    {/* Q3 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col hover:border-amber-300 transition-colors">
                        <div className="flex justify-between mb-2 items-center">
                            <span className="font-bold text-amber-700 flex items-center group relative cursor-help select-none">
                                <MoreHorizontal size={18} className="mr-2"/> 
                                Giao việc (Q3)
                                <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-10 font-normal leading-relaxed">
                                    <strong>Không quan trọng & Khẩn cấp.</strong><br/>Việc ngắt quãng, nên ủy quyền.
                                    <div className="absolute bottom-full left-4 -mb-1 border-4 border-transparent border-b-gray-800"></div>
                                </div>
                            </span>
                        </div>
                        {/* Inline Add Input */}
                        <div className="flex items-center mb-3 bg-white p-1 rounded border border-amber-200">
                            <input 
                                className="flex-1 text-xs px-2 py-1 outline-none"
                                placeholder="Thêm việc..."
                                value={quickAddInputs[Quadrant.Q3]}
                                onChange={(e) => handleInputChange(Quadrant.Q3, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(Quadrant.Q3)}
                            />
                            <button onClick={() => handleQuickAdd(Quadrant.Q3)} className="bg-amber-100 text-amber-600 p-1 rounded hover:bg-amber-200">
                                <Plus size={16}/>
                            </button>
                        </div>
                        {renderEisenhowerTasks(weeklyTasks.filter(t => t.quadrant === Quadrant.Q3), "border-amber-500", "hover:bg-amber-50")}
                    </div>

                    {/* Q4 */}
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col hover:border-gray-300 transition-colors">
                        <div className="flex justify-between mb-2 items-center">
                            <span className="font-bold text-gray-700 flex items-center group relative cursor-help select-none">
                                <Trash2 size={18} className="mr-2"/> 
                                Xóa bỏ (Q4)
                                <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-10 font-normal leading-relaxed">
                                    <strong>Không quan trọng & Không khẩn cấp.</strong><br/>Việc vô bổ, lãng phí thời gian.
                                    <div className="absolute bottom-full left-4 -mb-1 border-4 border-transparent border-b-gray-800"></div>
                                </div>
                            </span>
                        </div>
                        {/* Inline Add Input */}
                        <div className="flex items-center mb-3 bg-white p-1 rounded border border-gray-300">
                            <input 
                                className="flex-1 text-xs px-2 py-1 outline-none"
                                placeholder="Thêm việc..."
                                value={quickAddInputs[Quadrant.Q4]}
                                onChange={(e) => handleInputChange(Quadrant.Q4, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(Quadrant.Q4)}
                            />
                            <button onClick={() => handleQuickAdd(Quadrant.Q4)} className="bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300">
                                <Plus size={16}/>
                            </button>
                        </div>
                        {renderEisenhowerTasks(weeklyTasks.filter(t => t.quadrant === Quadrant.Q4), "border-gray-500", "hover:bg-gray-50")}
                    </div>
                </div>
            </div>
        )}

        {/* 5/25 RULE */}
        {mode === 'RULE_5_25' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Kế hoạch Năm & Timeline Chiến Lược <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full ml-2">Warren Buffett</span></h2>
                    <p className="text-gray-600 text-sm mb-4 italic">"Sự khác biệt giữa người thành công và người rất thành công là người rất thành công nói KHÔNG với hầu hết mọi thứ." - Hãy tàn nhẫn với những điều tốt để đạt được những điều tuyệt vời.</p>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            id="goalInput"
                            placeholder="Nhập mục tiêu năm nay (VD: Học đàn, Mua nhà...)"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-indigo-500"
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    if(input.value.trim()) {
                                        handleAddGoal(input.value.trim());
                                        input.value = '';
                                    }
                                }
                            }}
                        />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('goalInput') as HTMLInputElement;
                                if(input.value.trim()) {
                                    handleAddGoal(input.value.trim());
                                    input.value = '';
                                }
                            }}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
                        >
                            + Thêm
                        </button>
                    </div>

                    {/* Timeline & Top 5 Detailed View */}
                    <div className="border rounded-xl p-6 bg-gray-50 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700 text-lg">Timeline & Các giai đoạn thực hiện</h3>
                            {/* Removed top header labels */}
                        </div>

                        {goals.filter(g => g.isTop5).length === 0 && (
                            <div className="text-center text-gray-400 py-10 bg-white rounded-lg border border-dashed border-gray-300">
                                Chưa có mục tiêu nào trong Top 5. Hãy chọn từ danh sách bên dưới!
                            </div>
                        )}

                        <div className="space-y-4">
                            {goals.filter(g => g.isTop5).map(g => {
                                const overdueMilestone = getOverdueMilestone(g.milestones);
                                return (
                                <div key={g.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div 
                                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedGoalId(expandedGoalId === g.id ? null : g.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center">
                                                <button onClick={(e) => { e.stopPropagation(); setExpandedGoalId(expandedGoalId === g.id ? null : g.id); }}>
                                                    {expandedGoalId === g.id ? <ChevronUp size={20} className="text-gray-400 mr-2"/> : <ChevronDown size={20} className="text-gray-400 mr-2"/>}
                                                </button>
                                                <h4 className="font-bold text-gray-800 text-lg">{g.title}</h4>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {overdueMilestone && (
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold flex items-center animate-pulse border border-red-200">
                                                        <AlertCircle size={12} className="mr-1"/> Quá hạn: {overdueMilestone.title}
                                                    </span>
                                                )}
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400 font-bold uppercase">Tiến độ</div>
                                                    <div className="font-bold text-indigo-600">{g.progress}%</div>
                                                </div>
                                                {/* Progress Bar Mini */}
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${g.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                                        style={{ width: `${g.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* T1-T12 Labels - Added directly above grid */}
                                        <div className="grid grid-cols-12 gap-1 mt-4 mb-1 px-0.5">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div key={i} className="text-[10px] text-gray-400 font-bold text-center uppercase">T{i + 1}</div>
                                            ))}
                                        </div>
                                        
                                        {/* Timeline Grid */}
                                        <div className="grid grid-cols-12 gap-1">
                                            {Array.from({ length: 12 }).map((_, mIdx) => {
                                                const { color, tooltip, isCurrentMonth } = getMonthInfo(mIdx, g.milestones);
                                                return (
                                                    <div 
                                                        key={mIdx}
                                                        className={`h-3 rounded-sm relative group transition-all ${color} ${isCurrentMonth ? 'ring-2 ring-indigo-400 ring-offset-1 z-10' : 'opacity-80 hover:opacity-100'}`}
                                                        title={tooltip}
                                                    >
                                                        {/* Tooltip Content */}
                                                        {tooltip !== `Tháng ${mIdx+1}` && (
                                                            <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[150px] bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-normal text-center">
                                                                {tooltip}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Expanded Details: Milestones Management */}
                                    {expandedGoalId === g.id && (
                                        <div className="border-t border-gray-100 p-4 bg-gray-50 animate-fade-in">
                                            <div className="flex justify-between items-center mb-3">
                                                <h5 className="font-bold text-gray-700 text-sm flex items-center">
                                                    <Flag size={16} className="mr-2 text-indigo-500"/> Các giai đoạn / Cột mốc
                                                </h5>
                                                {/* Legend for Timeline inside expanded view if needed, or put it globally */}
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {g.milestones?.map(m => {
                                                    const status = getMilestoneStatus(m);
                                                    return (
                                                        <div key={m.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                                            <div className="flex items-center">
                                                                <button 
                                                                    onClick={() => toggleMilestone(g.id, m.id)}
                                                                    className={`mr-3 rounded transition-colors ${m.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                                                                >
                                                                    {m.isCompleted ? <Check className="bg-green-100 rounded p-0.5" size={20}/> : <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>}
                                                                </button>
                                                                <div>
                                                                    <div className={`text-sm font-medium ${m.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.title}</div>
                                                                    <div className="text-xs text-gray-400 flex items-center">
                                                                        <span className="mr-2">{m.startDate} → {m.deadline}</span>
                                                                        <span className={`text-[10px] px-1.5 rounded border ${status.color}`}>{status.text}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => deleteMilestone(g.id, m.id)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                                        </div>
                                                    )
                                                })}
                                                {(!g.milestones || g.milestones.length === 0) && (
                                                    <div className="text-center text-xs text-gray-400 italic py-2">Chưa có giai đoạn nào.</div>
                                                )}
                                            </div>

                                            {/* Add Milestone Form */}
                                            <div className="flex gap-2 items-end bg-white p-3 rounded border border-gray-200">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tên giai đoạn</label>
                                                    <input 
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                                        placeholder="VD: Nghiên cứu..."
                                                        value={newMilestoneData.title}
                                                        onChange={(e) => setNewMilestoneData({...newMilestoneData, title: e.target.value})}
                                                    />
                                                </div>
                                                <div className="w-28 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Bắt đầu</label>
                                                    <input 
                                                        type="date"
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                                        value={newMilestoneData.start}
                                                        onChange={(e) => setNewMilestoneData({...newMilestoneData, start: e.target.value})}
                                                    />
                                                </div>
                                                 <div className="w-28 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Kết thúc</label>
                                                    <input 
                                                        type="date"
                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                                        value={newMilestoneData.end}
                                                        onChange={(e) => setNewMilestoneData({...newMilestoneData, end: e.target.value})}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => handleAddMilestone(g.id)}
                                                    className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 h-[30px]"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                        
                        {/* Timeline Legend */}
                        {goals.filter(g => g.isTop5).length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500 justify-center bg-white p-2 rounded border border-gray-100">
                                <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-1"></div> Hoàn thành</div>
                                <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-1"></div> Đang làm</div>
                                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-1 animate-pulse"></div> Quá hạn</div>
                                <div className="flex items-center"><div className="w-3 h-3 bg-gray-300 rounded mr-1"></div> Kế hoạch</div>
                                <div className="flex items-center"><div className="w-3 h-3 border-2 border-indigo-400 rounded mr-1 bg-transparent"></div> Tháng hiện tại</div>
                            </div>
                        )}
                    </div>

                    {/* The 20 List (Avoid) */}
                     <div className="border border-red-100 rounded-xl p-6 bg-red-50">
                        <h3 className="font-bold text-red-800 text-lg mb-2 flex items-center">
                            <span className="bg-red-200 text-red-800 p-1 rounded mr-2"><X size={16}/></span>
                            Danh sách "Cấm Đụng Vào"
                        </h3>
                        <p className="text-red-600 text-sm mb-4">Những việc "tốt" nhưng cần TÀN NHẪN bỏ qua trong năm nay để tập trung cho Top 5.</p>
                        <div className="bg-white rounded-lg border border-red-100 divide-y divide-red-50">
                             {goals.filter(g => !g.isTop5).map(g => (
                                 <div key={g.id} className="p-3 flex justify-between items-center group hover:bg-red-50 transition-colors">
                                     <span className="text-gray-600">{g.title}</span>
                                     <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => toggleTop5(g.id)}
                                            className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 hover:text-green-600 hover:border-green-300"
                                         >
                                             ↑ Top 5
                                         </button>
                                          <button 
                                            onClick={() => setGoals(goals.filter(goal => goal.id !== g.id))}
                                            className="text-gray-300 hover:text-red-500"
                                         >
                                             <Trash2 size={16}/>
                                         </button>
                                     </div>
                                 </div>
                             ))}
                             {goals.filter(g => !g.isTop5).length === 0 && (
                                 <div className="p-4 text-center text-gray-400 italic text-sm">Danh sách trống.</div>
                             )}
                        </div>
                     </div>
                </div>
            </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa công việc</h3>
                    <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tên công việc</label>
                        <input 
                            className="w-full border border-blue-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        />
                    </div>
                    {/* Other inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-1">Hạn chót</label>
                             <input 
                                type="date"
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                value={editingTask.dueDate || ''}
                                onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                             />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Mức độ MoSCoW</label>
                            <select 
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                value={editingTask.moscow || 'MUST'}
                                onChange={(e) => setEditingTask({...editingTask, moscow: e.target.value as any})}
                            >
                                <option value="MUST">Phải làm (Must)</option>
                                <option value="SHOULD">Nên làm (Should)</option>
                                <option value="COULD">Có thể (Could)</option>
                                <option value="WONT">Không làm (Won't)</option>
                            </select>
                         </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded px-3 py-2 h-20 outline-none resize-none text-sm"
                            placeholder="Chi tiết công việc..."
                            value={editingTask.note || ''}
                            onChange={(e) => setEditingTask({...editingTask, note: e.target.value})}
                        ></textarea>
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Ma trận Eisenhower</label>
                            <div className="space-y-2">
                                <label className="flex items-center text-sm cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editingTask.quadrant === Quadrant.Q1 || editingTask.quadrant === Quadrant.Q3}
                                        onChange={(e) => {
                                            const isUrgent = e.target.checked;
                                            const isImportant = editingTask.quadrant === Quadrant.Q1 || editingTask.quadrant === Quadrant.Q2;
                                            let newQ = Quadrant.Q4;
                                            if (isUrgent && isImportant) newQ = Quadrant.Q1;
                                            else if (!isUrgent && isImportant) newQ = Quadrant.Q2;
                                            else if (isUrgent && !isImportant) newQ = Quadrant.Q3;
                                            setEditingTask({...editingTask, quadrant: newQ});
                                        }}
                                        className="mr-2 w-4 h-4 text-blue-600 rounded"
                                    />
                                    Khẩn cấp
                                </label>
                                <label className="flex items-center text-sm cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editingTask.quadrant === Quadrant.Q1 || editingTask.quadrant === Quadrant.Q2}
                                        onChange={(e) => {
                                            const isImportant = e.target.checked;
                                            const isUrgent = editingTask.quadrant === Quadrant.Q1 || editingTask.quadrant === Quadrant.Q3;
                                            let newQ = Quadrant.Q4;
                                            if (isUrgent && isImportant) newQ = Quadrant.Q1;
                                            else if (!isUrgent && isImportant) newQ = Quadrant.Q2;
                                            else if (isUrgent && !isImportant) newQ = Quadrant.Q3;
                                            setEditingTask({...editingTask, quadrant: newQ});
                                        }}
                                        className="mr-2 w-4 h-4 text-blue-600 rounded"
                                    />
                                    Quan trọng
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kích thước</label>
                            <select 
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                value={editingTask.pickleSize}
                                onChange={(e) => setEditingTask({...editingTask, pickleSize: e.target.value as any})}
                            >
                                <option value={PickleSize.ROCK}>Đá tảng (Lớn)</option>
                                <option value={PickleSize.PEBBLE}>Sỏi (Vừa)</option>
                                <option value={PickleSize.SAND}>Cát (Nhỏ)</option>
                            </select>
                        </div>
                     </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                    <button 
                        onClick={handleDeleteTask}
                        className="text-red-500 hover:text-red-700 font-medium px-4 py-2 flex items-center"
                    >
                        <Trash2 size={16} className="mr-1"/> Xóa
                    </button>
                    <div className="flex space-x-2">
                         <button 
                            onClick={() => setEditingTask(null)}
                            className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleUpdateTask}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
        )}
    </div>
  );
};
