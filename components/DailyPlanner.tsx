
import React, { useState, useEffect, useRef } from 'react';
import { DailyLog, ScheduleBlock, Task, TaskStatus, YearlyGoal, Quadrant, PickleSize } from '../types';
import { Printer, Plus, Trash2, X, Link as LinkIcon, Calendar, CheckCircle, Circle, ChevronLeft, ChevronRight, Check, Quote, Edit2, ArrowRight, Copy, Brain, ArrowUpRight } from 'lucide-react';

interface DailyPlannerProps {
  log: DailyLog;
  setLog: (log: DailyLog) => void;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  goals: YearlyGoal[];
  onAddTask: (title: string, size: PickleSize) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTaskToNextDay: (id: string) => void;
  onCopySchedule?: () => void;
  
  // New Props for Learning Integration
  dueFlashcardsCount?: number;
  onNavigateToLearning?: () => void;
}

const RANDOM_QUOTES = [
    "Hành trình vạn dặm bắt đầu từ một bước chân.",
    "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.",
    "Đừng để ngày hôm qua chiếm quá nhiều của ngày hôm nay.",
    "Cách tốt nhất để dự đoán tương lai là tạo ra nó.",
    "Tập trung là vũ khí bí mật của người thành công.",
    "Bạn không cần phải tuyệt vời để bắt đầu, nhưng bạn phải bắt đầu để trở nên tuyệt vời."
];

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ log, setLog, onDateChange, tasks, goals, onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onMoveTaskToNextDay, onCopySchedule, dueFlashcardsCount = 0, onNavigateToLearning }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSize, setNewTaskSize] = useState<PickleSize>(PickleSize.SAND); // Default to SAND
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState("");

  // Habit State
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  // Set random quote on mount
  useEffect(() => {
      setQuote(RANDOM_QUOTES[Math.floor(Math.random() * RANDOM_QUOTES.length)]);
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle schedule changes
  const updateSchedule = (index: number, field: 'taskLeft' | 'taskRight', value: string) => {
    const newSchedule = [...log.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setLog({ ...log, schedule: newSchedule });
  };

  // Sort tasks: Active tasks first, then Done tasks
  const sortedTasks = [...tasks].sort((a, b) => {
      if (a.status === TaskStatus.DONE && b.status !== TaskStatus.DONE) return 1;
      if (a.status !== TaskStatus.DONE && b.status === TaskStatus.DONE) return -1;
      return 0; // Keep original order otherwise
  });

  // Calculate Progress
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;

  const handlePrint = () => {
    // Change title temporarily for the PDF filename
    const originalTitle = document.title;
    const dateStr = new Date(log.date).toLocaleDateString('vi-VN').replace(/\//g, '-');
    document.title = `KeHoachNgay_${dateStr}`;
    window.print();
    // Restore title
    document.title = originalTitle;
  };

  const handleDeleteClick = (id: string) => {
      // Instant delete (no confirmation) to match Milestone behavior
      onDeleteTask(id);
      
      // If the task being deleted is currently open in the modal, close the modal
      if (editingTask?.id === id) {
          setEditingTask(null);
      }
  };
  
  const confirmDelete = (id: string) => {
       // Using the direct delete handler passed from parent which uses functional update
       // We keep this wrapper function to maintain compatibility if we add logic later
       onDeleteTask(id);
       if (editingTask?.id === id) {
          setEditingTask(null);
      }
  }


  const moodIcons = [
    { type: 'great', icon: '😄' },
    { type: 'good', icon: '🙂' },
    { type: 'neutral', icon: '😐' },
    { type: 'bad', icon: '☹️' },
  ];

  const handleSaveTask = () => {
    if (editingTask) {
        onUpdateTask(editingTask);
        setEditingTask(null);
    }
  };

  const cycleTaskSize = (task: Task) => {
      let newSize = PickleSize.SAND;
      if (task.pickleSize === PickleSize.SAND) newSize = PickleSize.PEBBLE;
      else if (task.pickleSize === PickleSize.PEBBLE) newSize = PickleSize.ROCK;
      
      onUpdateTask({ ...task, pickleSize: newSize });
  };

  // --- HABIT LOGIC ---
  const handleAddHabit = () => {
      if (!newHabitName.trim()) return;
      const newHabit = { 
          id: Date.now().toString(), 
          name: newHabitName.trim(), 
          completed: false 
      };
      const currentHabits = log.habits || [];
      setLog({ ...log, habits: [...currentHabits, newHabit] });
      setNewHabitName('');
  };

  const handleDeleteHabit = (id: string) => {
      // Instant delete for habits as well
      const currentHabits = log.habits || [];
      setLog({ ...log, habits: currentHabits.filter(h => h.id !== id) });
  };

  const startEditingHabit = (id: string, name: string) => {
      setEditingHabitId(id);
      setEditingHabitName(name);
  };

  const saveEditingHabit = () => {
      if (editingHabitId) {
          const currentHabits = log.habits || [];
          setLog({
              ...log,
              habits: currentHabits.map(h => h.id === editingHabitId ? { ...h, name: editingHabitName } : h)
          });
          setEditingHabitId(null);
          setEditingHabitName('');
      }
  };
  // -------------------

  // --- CALENDAR LOGIC ---
  const [viewDate, setViewDate] = useState(new Date(log.date));
  
  // Sync viewDate when log.date changes
  useEffect(() => {
      setViewDate(new Date(log.date));
  }, [log.date]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
      // JS returns 0 for Sunday, we want 0 for Monday to match VN layout
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      // Empty slots for previous month
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="p-2"></div>);
      }
      // Days
      for (let i = 1; i <= daysInMonth; i++) {
          const currentDayStr = new Date(year, month, i).toDateString();
          const selectedDayStr = new Date(log.date).toDateString();
          const todayStr = new Date().toDateString();
          
          let bgClass = "hover:bg-indigo-50 text-gray-700";
          if (currentDayStr === selectedDayStr) bgClass = "bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md";
          else if (currentDayStr === todayStr) bgClass = "bg-yellow-100 text-yellow-700 font-bold border border-yellow-300";

          days.push(
              <button 
                key={i} 
                onClick={() => {
                    const newDate = new Date(year, month, i);
                    onDateChange(newDate);
                    setShowCalendar(false);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${bgClass}`}
              >
                  {i}
              </button>
          );
      }
      return days;
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
      setViewDate(newDate);
  };
  // ----------------------

  return (
    <div className="w-full mx-auto bg-white shadow-lg p-6 md:p-8 min-h-screen print-container relative text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 border-b-2 border-dashed border-gray-400 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-gray-800 uppercase tracking-wider handwriting">To Day Is New Day ☀️</h1>
          </div>
          
          <div className="flex items-center mt-3">
            <span className="text-amber-600 font-bold mr-2 handwriting text-xl whitespace-nowrap">♥ Tôi biết ơn:</span>
            <div className="flex-1 border-b border-gray-300 border-dashed print:border-gray-400 print:border-b print:border-dashed">
                {/* Input for screen */}
                <input 
                    type="text" 
                    value={log.gratitude}
                    onChange={(e) => setLog({...log, gratitude: e.target.value})}
                    className="w-full outline-none px-2 handwriting text-lg bg-transparent placeholder-gray-300"
                    placeholder="Viết điều bạn biết ơn..."
                />
                {/* Text for print - Only visible in print */}
                <div className="hidden print:block print-only-text px-2 handwriting text-lg">{log.gratitude}</div>
            </div>
          </div>
        </div>
        <div className="text-right ml-4 relative" ref={calendarRef}>
             <div className="flex space-x-2 mb-2 no-print justify-end">
                <button onClick={handlePrint} className="flex items-center px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-black transition-colors shadow-sm">
                    <Printer size={16} className="mr-1" /> In / Xuất PDF
                </button>
             </div>
             
             {/* DATE DISPLAY & CALENDAR TRIGGER */}
             <div 
                className="text-lg font-bold border-b-2 border-gray-800 inline-flex items-center pb-1 whitespace-nowrap cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => setShowCalendar(!showCalendar)}
             >
                <Calendar size={20} className="mr-2" />
                <span>DATE: {new Date(log.date).toLocaleDateString('vi-VN')}</span>
             </div>

             {/* MINI CALENDAR POPUP */}
             {showCalendar && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-72 animate-fade-in no-print">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                        <span className="font-bold text-gray-800 capitalize">Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                            <div key={d} className="text-xs font-bold text-gray-400">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {renderCalendar()}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                        <button 
                            onClick={() => {
                                onDateChange(new Date());
                                setShowCalendar(false);
                            }}
                            className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                            Hôm nay
                        </button>
                    </div>
                </div>
             )}
        </div>
      </div>

      {/* Main Grid: Equal Columns 4-4-4 */}
      <div className="grid grid-cols-1 md:grid-cols-12 print:grid print:grid-cols-12 gap-6 print:gap-4 items-start">
        
        {/* Left Column: Schedule (4 cols in print ~ 33%) */}
        <div className="md:col-span-4 print:col-span-4 border-2 border-gray-800 rounded-lg overflow-hidden flex flex-col items-start h-auto print-border">
          <div className="bg-gray-200 p-2 text-center font-bold border-b-2 border-gray-800 w-full print:bg-gray-200 flex items-center justify-between">
            <span className="w-6"></span>
            <span>LỊCH TRÌNH</span>
            {onCopySchedule && (
                <button 
                    onClick={onCopySchedule}
                    className="p-1 hover:bg-gray-300 rounded text-gray-500 hover:text-gray-800 no-print"
                    title="Sao chép từ hôm qua"
                >
                    <Copy size={14}/>
                </button>
            )}
          </div>
          <div className="grid grid-cols-5 bg-amber-300 border-b border-gray-800 text-xs font-bold text-center py-1 w-full print:bg-amber-300">
             <div className="col-span-1 border-r border-gray-800">🕒</div>
             <div className="col-span-2 border-r border-gray-800">30 min</div>
             <div className="col-span-2">30 min</div>
          </div>
          <div className="w-full">
             {log.schedule.map((slot, idx) => {
                const showTime = slot.time.endsWith(':00');
                return (
                <div key={idx} className="grid grid-cols-5 border-b border-gray-300 min-h-[35px] text-xs">
                    <div className="col-span-1 border-r border-gray-300 flex items-center justify-center font-bold bg-yellow-50 print:bg-yellow-50">
                        {showTime ? slot.time : ''}
                    </div>
                    <div className="col-span-2 border-r border-gray-300 relative group">
                        <input 
                            className="w-full h-full px-1 outline-none bg-transparent text-center print:hidden" 
                            value={slot.taskLeft || ''}
                            onChange={(e) => updateSchedule(idx, 'taskLeft', e.target.value)}
                        />
                        {/* Hidden on screen, visible on print */}
                        <div className="hidden print:flex print-only-text w-full h-full items-center justify-center text-center">{slot.taskLeft}</div>
                    </div>
                    <div className="col-span-2 relative group">
                        <input 
                            className="w-full h-full px-1 outline-none bg-transparent text-center print:hidden" 
                            value={slot.taskRight || ''}
                            onChange={(e) => updateSchedule(idx, 'taskRight', e.target.value)}
                        />
                        {/* Hidden on screen, visible on print */}
                        <div className="hidden print:flex print-only-text w-full h-full items-center justify-center text-center">{slot.taskRight}</div>
                    </div>
                </div>
                );
             })}
          </div>
        </div>

        {/* Middle Column: Goals & Tasks (4 cols in print ~ 33%) */}
        <div className="md:col-span-4 print:col-span-4 flex flex-col space-y-4">
            {/* Big Goal */}
            <div className={`border-2 border-gray-800 rounded-lg p-3 relative transition-colors print-border ${log.bigGoalCompleted ? 'bg-green-50 print:bg-transparent' : 'bg-white'}`}>
                <div className="flex justify-between items-center border-b border-dashed border-gray-400 pb-2 mb-2">
                    <h3 className="font-bold flex items-center text-sm uppercase">
                        <span className="mr-1">🐸</span> Mục tiêu lớn hôm nay
                    </h3>
                    <div className="flex items-center bg-gray-100 rounded px-1 print:bg-transparent border border-gray-200 print:border-gray-800">
                        <input 
                            type="time"
                            value={log.bigGoalTime || '09:00'}
                            onChange={(e) => setLog({...log, bigGoalTime: e.target.value})}
                            className="text-xs bg-transparent outline-none font-mono"
                        />
                        <div className="hidden print:block print-only-text text-xs font-mono">{log.bigGoalTime || '09:00'}</div>
                    </div>
                </div>
                <textarea 
                    className={`w-full min-h-[96px] outline-none resize-none handwriting text-xl bg-transparent ${log.bigGoalCompleted ? 'line-through text-gray-500' : ''}`}
                    placeholder="Ăn con ếch (Việc khó nhất)..."
                    value={log.bigGoal || ''}
                    onChange={(e) => setLog({...log, bigGoal: e.target.value})}
                ></textarea>
                <div className={`hidden print:block print-only-text w-full min-h-[96px] handwriting text-xl ${log.bigGoalCompleted ? 'line-through' : ''}`}>
                    {log.bigGoal}
                </div>
                
                {/* Bottom Actions for Big Goal */}
                <div className="flex justify-between items-end mt-1 pt-2 border-t border-gray-100">
                     <div className="flex items-center">
                         <LinkIcon size={14} className="text-gray-400 mr-1" />
                         {/* Show select in edit mode, text in print mode */}
                         <div className="print:hidden">
                            <select
                                className="text-xs bg-transparent border-none outline-none text-gray-600 max-w-[150px] truncate hover:text-indigo-600 cursor-pointer"
                                value={log.bigGoalYearlyGoalId || ''}
                                onChange={(e) => setLog({...log, bigGoalYearlyGoalId: e.target.value})}
                            >
                                <option value="">-- Liên kết mục tiêu --</option>
                                {goals.filter(g => g.isTop5).map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>
                         </div>
                         <div className="hidden print:block text-xs text-gray-600 italic">
                            {goals.find(g => g.id === log.bigGoalYearlyGoalId)?.title || ''}
                         </div>
                     </div>
                     
                     {/* Big Goal Toggle (Interactive vs Static Print) */}
                     <div className="no-print">
                        <button 
                            onClick={() => setLog({...log, bigGoalCompleted: !log.bigGoalCompleted})}
                            className={`cursor-pointer transition-colors ${log.bigGoalCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                            title="Đánh dấu hoàn thành"
                        >
                            {log.bigGoalCompleted ? <CheckCircle size={28} /> : <Circle size={28} />}
                        </button>
                     </div>
                     <div className="hidden print:block">
                        {log.bigGoalCompleted ? <CheckCircle size={28} className="text-black" /> : <Circle size={28} className="text-gray-300" />}
                     </div>
                </div>
            </div>

            {/* Task List */}
            <div className="border-t-2 border-b-2 border-gray-200 py-2 print:border-gray-300">
                <h3 className="font-bold text-gray-500 text-sm mb-2 uppercase tracking-wide flex justify-between items-center">
                    <span>Danh sách công việc</span>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-normal no-print">
                        {doneTasks}/{totalTasks}
                    </span>
                </h3>

                <div className="space-y-2">
                    {sortedTasks.map(task => {
                        const linkedGoal = goals.find(g => g.id === task.yearlyGoalId);
                        const isDone = task.status === TaskStatus.DONE;
                        return (
                         <div key={task.id} className={`flex items-start group relative min-h-[30px] transition-all ${isDone ? 'opacity-60' : ''}`}>
                            {/* Toggle Completion Button (Screen) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop edit modal
                                    onToggleTask(task.id);
                                }}
                                className={`w-5 h-5 rounded-full border-2 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors print:border-gray-800 z-20 cursor-pointer no-print ${isDone ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
                                title={isDone ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                            >
                                {isDone && <Check size={12} className="text-green-600" strokeWidth={3} />}
                            </button>

                            {/* Static Icon (Print) */}
                            <div className="hidden print:flex w-5 h-5 rounded-full border-2 border-gray-800 mr-2 mt-0.5 flex-shrink-0 items-center justify-center">
                                {isDone && <Check size={12} className="text-black" strokeWidth={3} />}
                            </div>
                            
                            <div className="flex-1 border-b border-gray-100 pb-1 print:border-gray-200 pr-16 relative">
                                <div className={`text-sm font-medium print:text-base ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {task.title}
                                </div>
                                {linkedGoal && (
                                    <div className="text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded inline-block mt-0.5 border border-indigo-100 print:bg-gray-100 print:text-gray-600 print:border-gray-300">
                                        🔗 {linkedGoal.title}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center ml-2 absolute right-0 top-0 bottom-1">
                                {/* Size Badge */}
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        cycleTaskSize(task);
                                    }}
                                    className={`text-[10px] px-1 rounded h-5 flex items-center border border-transparent cursor-pointer select-none print:border-gray-300 z-20 ${
                                    task.pickleSize === 'ROCK' ? 'bg-red-100 text-red-600 print:bg-transparent print:text-black' : 
                                    task.pickleSize === 'PEBBLE' ? 'bg-blue-100 text-blue-600 print:bg-transparent print:text-black' : 'bg-gray-100 text-gray-500 print:bg-transparent print:text-black'
                                } hover:opacity-80`}>
                                    {task.pickleSize === 'ROCK' ? 'Đá' : task.pickleSize === 'PEBBLE' ? 'Sỏi' : 'Cát'}
                                </span>
                                
                                {/* Move to Next Day Button (Only for undone tasks) - HIDDEN IN PRINT */}
                                {!isDone && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Dời công việc này sang ngày mai?")) {
                                                onMoveTaskToNextDay(task.id);
                                            }
                                        }}
                                        className="ml-2 text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 no-print z-20 relative"
                                        title="Dời sang ngày mai"
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                )}

                                {/* Delete Button - TRASH CAN - HIDDEN IN PRINT */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening edit modal
                                        handleDeleteClick(task.id);
                                    }}
                                    className="ml-1 text-gray-400 hover:text-red-600 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-50 no-print z-20 relative cursor-pointer"
                                    title="Xóa công việc"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Edit Trigger - Background layer */}
                            <div className="absolute inset-0 cursor-pointer no-print z-0" onClick={() => setEditingTask(task)}></div>
                         </div>
                        );
                    })}
                    {/* Placeholder when empty */}
                    {sortedTasks.length === 0 && (
                        <div className="text-center text-gray-300 italic text-sm py-4 print:hidden">
                            Chưa có công việc nào. Thêm bên dưới!
                        </div>
                    )}

                    {/* Input for new task - Hidden in Print */}
                    <div className="flex items-center mt-4 border-t border-gray-300 pt-2 no-print bg-gray-50 p-2 rounded">
                         <div className="flex items-center bg-white border border-gray-300 rounded-l px-2 h-[34px] mr-[-1px] z-10">
                            {/* Size Selector */}
                            <select 
                                value={newTaskSize}
                                onChange={(e) => setNewTaskSize(e.target.value as PickleSize)}
                                className="text-xs outline-none bg-transparent cursor-pointer font-bold text-gray-600"
                                title="Chọn kích thước (Đá/Sỏi/Cát)"
                            >
                                <option value={PickleSize.SAND}>Cát (Nhỏ)</option>
                                <option value={PickleSize.PEBBLE}>Sỏi (Vừa)</option>
                                <option value={PickleSize.ROCK}>Đá (Lớn)</option>
                            </select>
                         </div>
                        <input 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTaskTitle.trim()) {
                                    onAddTask(newTaskTitle, newTaskSize);
                                    setNewTaskTitle('');
                                }
                            }}
                            className="flex-1 border border-gray-300 rounded-r px-3 h-[34px] text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                            placeholder="Thêm việc nhỏ..."
                        />
                        <button 
                            onClick={() => { if(newTaskTitle.trim()) { onAddTask(newTaskTitle, newTaskSize); setNewTaskTitle(''); }}}
                            className="ml-2 bg-indigo-600 text-white rounded p-1.5 hover:bg-indigo-700 transition-colors h-[34px] w-[34px] flex items-center justify-center"
                        >
                            <Plus size={20}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Journal */}
            <div className="border-2 border-gray-800 rounded-lg p-3 bg-white print-border">
                 <div className="flex justify-between items-center border-b border-gray-800 pb-1 mb-2">
                    <span className="font-bold flex items-center text-sm uppercase">🏆 Nhật ký thành công</span>
                 </div>
                 <textarea 
                    value={log.successJournal}
                    onChange={(e) => setLog({...log, successJournal: e.target.value})}
                    className="w-full min-h-[64px] outline-none resize-none handwriting text-base bg-transparent"
                    placeholder="1. Tôi đã hoàn thành..."
                 ></textarea>
                 <div className="hidden print:block print-only-text w-full min-h-[64px] handwriting text-base whitespace-pre-wrap">{log.successJournal}</div>
            </div>
             {/* Lesson learned */}
             <div className="border-2 border-gray-800 rounded-lg p-3 bg-white print-border">
                 <div className="flex justify-end items-center border-b border-gray-800 pb-1 mb-2">
                    <span className="font-bold text-sm uppercase">Bài học hôm nay</span>
                 </div>
                 <textarea 
                    value={log.lessonLearned}
                    onChange={(e) => setLog({...log, lessonLearned: e.target.value})}
                    className="w-full min-h-[40px] outline-none resize-none handwriting text-base bg-transparent"
                 ></textarea>
                 <div className="hidden print:block print-only-text w-full min-h-[40px] handwriting text-base whitespace-pre-wrap">{log.lessonLearned}</div>
            </div>
        </div>

        {/* Right Column: Mood, Water, Finance, Habits, Notes (4 cols in print ~ 33%) */}
        <div className="md:col-span-4 print:col-span-4 flex flex-col space-y-4">
             {/* Mood */}
            <div className="border-2 border-gray-800 rounded-lg p-3 print-border">
                 <div className="text-center font-bold text-sm mb-2 uppercase">Cảm xúc hôm nay</div>
                 <div className="flex justify-center space-x-2 mb-2">
                    {moodIcons.map((m) => (
                        <button 
                            key={m.type}
                            onClick={() => setLog({...log, mood: m.type as any})}
                            className={`text-2xl transition-transform ${log.mood === m.type ? 'scale-125' : 'opacity-50 hover:opacity-100'} ${log.mood === m.type ? 'print:opacity-100 print:scale-125' : 'print:opacity-30'}`}
                        >
                            {m.icon}
                        </button>
                    ))}
                 </div>
                 <input 
                    className="w-full text-xs text-center border-t border-gray-200 pt-2 outline-none italic print:border-gray-400 placeholder-gray-300 print:placeholder-transparent"
                    placeholder="Lý do? (Sự kiện...)"
                    value={log.moodNote}
                    onChange={(e) => setLog({...log, moodNote: e.target.value})}
                />
                <div className="hidden print:block print-only-text text-xs text-center border-t border-gray-800 pt-2 italic">{log.moodNote}</div>
            </div>

            {/* Learning Status Widget (Replaces Water Tracker) */}
            <div className="border-2 border-gray-800 rounded-lg p-3 print-border bg-white">
                 <div className="text-center font-bold text-sm mb-2 uppercase flex items-center justify-center text-indigo-600 print:text-black">
                     <Brain size={16} className="mr-1 fill-current"/> Trạng thái học tập
                 </div>
                 
                 <div className="text-center">
                    {dueFlashcardsCount > 0 ? (
                        <>
                            <div className="text-3xl font-extrabold text-red-500 mb-1">{dueFlashcardsCount}</div>
                            <div className="text-xs text-gray-500 mb-3 font-bold">Thẻ cần ôn tập hôm nay</div>
                            {onNavigateToLearning && (
                                <button 
                                    onClick={onNavigateToLearning}
                                    className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center no-print"
                                >
                                    Ôn tập ngay <ArrowUpRight size={12} className="ml-1"/>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="py-2">
                            <div className="flex justify-center mb-2">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <CheckCircle size={24} className="text-green-600" />
                                </div>
                            </div>
                            <div className="text-sm font-bold text-gray-800">Đã hoàn thành!</div>
                            <div className="text-xs text-gray-500 mt-1">Không có thẻ nào cần ôn.</div>
                            {onNavigateToLearning && (
                                <button 
                                    onClick={onNavigateToLearning}
                                    className="mt-3 text-indigo-600 text-xs font-bold hover:underline no-print"
                                >
                                    Vào thư viện
                                </button>
                            )}
                        </div>
                    )}
                 </div>
            </div>

            {/* Finance */}
            <div className="border-2 border-gray-800 rounded-lg overflow-hidden print-border">
                <div className="grid grid-cols-2 text-xs font-bold text-center bg-white border-b-2 border-gray-800">
                    <div className="border-r-2 border-gray-800 py-1 uppercase">Thu</div>
                    <div className="py-1 uppercase">Chi</div>
                </div>
                <div className="grid grid-cols-2 text-sm h-16">
                     <div className="border-r-2 border-gray-800 p-1">
                        <input 
                            type="number"
                            className="w-full h-full outline-none text-right text-green-600 font-mono print:text-black"
                            placeholder="0"
                            value={log.finance.income || ''}
                            onChange={(e) => setLog({...log, finance: {...log.finance, income: parseInt(e.target.value) || 0}})}
                        />
                        <div className="hidden print:flex print-only-text w-full h-full text-right font-mono items-center justify-end">{(log.finance.income || 0).toLocaleString('vi-VN')}</div>
                     </div>
                     <div className="p-1">
                        <input 
                            type="number"
                            className="w-full h-full outline-none text-right text-red-600 font-mono print:text-black"
                            placeholder="0"
                            value={log.finance.expense || ''}
                            onChange={(e) => setLog({...log, finance: {...log.finance, expense: parseInt(e.target.value) || 0}})}
                        />
                        <div className="hidden print:flex print-only-text w-full h-full text-right font-mono items-center justify-end">{(log.finance.expense || 0).toLocaleString('vi-VN')}</div>
                     </div>
                </div>
                 <div className="bg-gray-100 text-[10px] text-center py-1 font-bold border-t-2 border-gray-800 flex justify-around print:bg-gray-100">
                    <span className="text-green-700 print:text-black">Thu: {(log.finance.income || 0).toLocaleString('vi-VN')}</span>
                    <span className="text-red-700 print:text-black">Chi: {(log.finance.expense || 0).toLocaleString('vi-VN')}</span>
                 </div>
                 <div className="bg-gray-800 text-white text-xs text-center py-1 font-bold print:bg-gray-800 print:text-white">
                    Dư: {(log.finance.income - log.finance.expense).toLocaleString('vi-VN')} đ
                 </div>
            </div>

            {/* Daily Habits (EDITABLE) */}
            <div className="border-2 border-gray-800 rounded-lg p-3 print-border">
                 <div className="font-bold text-sm mb-2 uppercase border-b border-dashed border-gray-400 pb-1">Thói quen nhỏ</div>
                 <div className="space-y-2">
                    {log.habits?.map(h => (
                        <div key={h.id} className="flex items-center justify-between group">
                            <div className="flex items-center flex-1">
                                <button 
                                    onClick={() => {
                                        const updatedHabits = log.habits?.map(hab => hab.id === h.id ? {...hab, completed: !hab.completed} : hab);
                                        setLog({...log, habits: updatedHabits});
                                    }}
                                    className={`w-5 h-5 border border-gray-400 rounded flex items-center justify-center transition-colors print:border-gray-800 mr-2 ${h.completed ? 'bg-green-100 border-green-500' : 'bg-white'}`}
                                >
                                    {h.completed && <Check size={14} className="text-green-600 print:text-black"/>}
                                </button>
                                
                                {editingHabitId === h.id ? (
                                    <div className="flex flex-1 items-center space-x-1 no-print">
                                        <input 
                                            value={editingHabitName}
                                            onChange={(e) => setEditingHabitName(e.target.value)}
                                            className="flex-1 text-sm border border-blue-400 rounded px-1 outline-none"
                                            autoFocus
                                            onKeyDown={(e) => { if(e.key === 'Enter') saveEditingHabit(); }}
                                        />
                                        <button onClick={saveEditingHabit} className="text-green-600"><Check size={16}/></button>
                                    </div>
                                ) : (
                                    <span className={`text-sm ${h.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{h.name}</span>
                                )}
                            </div>
                            
                            {/* Actions (Edit/Delete) */}
                            {editingHabitId !== h.id && (
                                <div className="flex items-center space-x-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditingHabit(h.id, h.name)}
                                        className="text-gray-400 hover:text-blue-600 p-1"
                                        title="Sửa tên"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteHabit(h.id)}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="Xóa thói quen"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Fallback for old logs without habits */}
                    {(!log.habits || log.habits.length === 0) && (
                        <div className="text-xs text-gray-400 italic text-center">Chưa có thói quen.</div>
                    )}

                    {/* Add Habit Input */}
                    <div className="flex items-center mt-2 pt-2 border-t border-gray-100 no-print">
                        <input 
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-indigo-400"
                            placeholder="Thêm thói quen..."
                            onKeyDown={(e) => { if(e.key === 'Enter') handleAddHabit(); }}
                        />
                        <button 
                            onClick={handleAddHabit}
                            className="ml-1 text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                 </div>
            </div>

            {/* Future Notes */}
            <div className="border-2 border-gray-800 rounded-lg p-3 relative h-32 bg-white print-border">
                <div className="font-bold text-sm mb-2 text-center bg-yellow-100 inline-block px-2 mx-auto transform -rotate-2 border border-gray-400 shadow-sm absolute top-[-10px] left-1/2 -translate-x-1/2 print:bg-yellow-100 print:border-gray-800 whitespace-nowrap">
                    Ghi chú cho tương lai
                </div>
                <textarea 
                    value={log.futureNote}
                    onChange={(e) => setLog({...log, futureNote: e.target.value})}
                    className="w-full h-full pt-4 outline-none resize-none handwriting text-sm bg-transparent"
                    placeholder="Viết gì đó..."
                ></textarea>
                <div className="hidden print:block print-only-text w-full h-full pt-4 handwriting text-sm whitespace-pre-wrap">{log.futureNote}</div>
            </div>
        </div>

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
                             <label className="block text-xs font-bold text-gray-500 mb-1">Liên kết Mục tiêu Năm</label>
                             <select 
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                value={editingTask.yearlyGoalId || ''}
                                onChange={(e) => setEditingTask({...editingTask, yearlyGoalId: e.target.value})}
                             >
                                <option value="">-- Chọn mục tiêu --</option>
                                {goals.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-1">Hạn chót</label>
                             <input 
                                type="date"
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm outline-none"
                                value={editingTask.dueDate || ''}
                                onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                             />
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
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Mức độ MoSCoW</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                                    value={editingTask.moscow || 'SHOULD'}
                                    onChange={(e) => setEditingTask({...editingTask, moscow: e.target.value as any})}
                                >
                                    <option value="MUST">Phải làm (Must)</option>
                                    <option value="SHOULD">Nên làm (Should)</option>
                                    <option value="COULD">Có thể (Could)</option>
                                    <option value="WONT">Không làm (Won't)</option>
                                </select>
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
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                     <button 
                        type="button"
                        onClick={() => confirmDelete(editingTask.id)}
                        className="text-red-500 hover:text-red-700 font-medium px-4 py-2 flex items-center bg-red-50 rounded"
                    >
                        <Trash2 size={16} className="mr-1"/> Xóa
                    </button>
                    <div className="flex space-x-2">
                        <button 
                            type="button"
                            onClick={() => setEditingTask(null)}
                            className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button"
                            onClick={handleSaveTask}
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
  </div> 
  );
};
