
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Grid2X2, Target, Trash2, Save, RotateCcw, BookOpen } from 'lucide-react';
import { DailyPlanner } from './components/DailyPlanner';
import { Dashboard } from './components/Dashboard';
import { Tools } from './components/Tools';
import { Pomodoro } from './components/Pomodoro';
import { Learning } from './components/Learning';
import { DailyLog, Task, TaskStatus, Quadrant, PickleSize, YearlyGoal, KnowledgeNote } from './types';

// Default Data
const DEFAULT_LOG: DailyLog = {
  date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  gratitude: '',
  successJournal: '',
  lessonLearned: '',
  mood: null,
  moodNote: '',
  finance: { income: 0, expense: 0 },
  futureNote: '',
  schedule: Array.from({ length: 18 }, (_, i) => ({ 
    time: `${5 + i < 10 ? '0' : ''}${5 + i}:00`, 
    taskLeft: '', 
    taskRight: '' 
  })),
  habits: [
      { id: 'h1', name: 'Tập thể dục 30p', completed: false },
      { id: 'h2', name: 'Đọc sách 20 trang', completed: false },
      { id: 'h3', name: 'Ngủ trước 23h', completed: false },
  ]
};

const INITIAL_TASKS: Task[] = []; 

const INITIAL_GOALS: YearlyGoal[] = [
    { 
        id: '1', 
        title: 'Ra mắt sản phẩm SaaS', 
        isTop5: true, 
        progress: 35, 
        deadline: '2024-12-01',
        milestones: [
            { id: 'm1', title: 'Nghiên cứu thị trường', isCompleted: true, startDate: '2024-01-01', deadline: '2024-02-28' },
            { id: 'm2', title: 'Phát triển MVP', isCompleted: false, startDate: '2024-03-01', deadline: '2024-06-30' },
            { id: 'm3', title: 'Beta Testing', isCompleted: false, startDate: '2024-07-01', deadline: '2024-08-31' },
            { id: 'm4', title: 'Chính thức ra mắt', isCompleted: false, startDate: '2024-09-01', deadline: '2024-12-01' }
        ]
    },
    { id: '2', title: 'Chạy Marathon', isTop5: true, progress: 10, deadline: '2024-10-20', milestones: [] },
    { id: '3', title: 'Mua nhà', isTop5: true, progress: 20, deadline: '2024-12-31', milestones: [] },
    { id: '4', title: 'Học tiếng Tây Ban Nha', isTop5: true, progress: 0, deadline: '2024-12-31', milestones: [] },
    { id: '5', title: 'Đọc 50 cuốn sách', isTop5: false, progress: 0, milestones: [] },
    { id: '6', title: 'Học làm gốm', isTop5: false, progress: 0, milestones: [] },
    { id: '7', title: 'Du lịch Châu Âu', isTop5: false, progress: 0, milestones: [] }
];

const INITIAL_KNOWLEDGE: KnowledgeNote[] = [];

// Helper to get week key "YYYY-W##" (ISO Week Date)
const getWeekKey = (dateStr: string) => {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const week = Math.ceil((((d.getTime() - new Date(Date.UTC(year,0,1)).getTime()) / 86400000) + 1)/7);
  return `${year}-W${week}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PLANNER' | 'EISENHOWER' | 'RULE_5_25' | 'LEARNING'>('PLANNER');
  
  // --- STATE WITH LOCALSTORAGE PERSISTENCE ---

  // 1. Log History
  const [logHistory, setLogHistory] = useState<Record<string, DailyLog>>(() => {
      const saved = localStorage.getItem('uf_logHistory');
      if (saved) {
          return JSON.parse(saved);
      }
      return { [DEFAULT_LOG.date]: DEFAULT_LOG };
  });

  // 2. Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem('uf_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // 3. Goals
  const [goals, setGoals] = useState<YearlyGoal[]>(() => {
      const saved = localStorage.getItem('uf_goals');
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  // 4. Learning Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeNote[]>(() => {
      const saved = localStorage.getItem('uf_knowledge');
      return saved ? JSON.parse(saved) : INITIAL_KNOWLEDGE;
  });

  // Current Log State (derived/synced from logHistory)
  // We initialize it with today's log from history or default
  const todayKey = new Date().toISOString().split('T')[0];
  const [currentLog, setCurrentLog] = useState<DailyLog>(logHistory[todayKey] || { ...DEFAULT_LOG, date: todayKey });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
      localStorage.setItem('uf_logHistory', JSON.stringify(logHistory));
  }, [logHistory]);

  useEffect(() => {
      localStorage.setItem('uf_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
      localStorage.setItem('uf_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
      localStorage.setItem('uf_knowledge', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);


  // Sync currentLog changes to history
  const updateCurrentLog = (newLog: DailyLog) => {
      setCurrentLog(newLog);
      setLogHistory(prev => ({
          ...prev,
          [newLog.date]: newLog
      }));
  };

  const handleDateChange = (date: Date) => {
      // Adjust date to local YYYY-MM-DD to avoid timezone shifts
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset*60*1000));
      const dateKey = localDate.toISOString().split('T')[0];

      if (logHistory[dateKey]) {
          // Merge with default to ensure new fields (habits) exist in old logs
          setCurrentLog({
              ...DEFAULT_LOG,
              ...logHistory[dateKey],
              // Ensure arrays are preserved if they exist, else default
              schedule: logHistory[dateKey].schedule || DEFAULT_LOG.schedule,
              habits: logHistory[dateKey].habits || DEFAULT_LOG.habits
          });
      } else {
          // Create new log for this date
          const newLog: DailyLog = {
              ...DEFAULT_LOG,
              date: dateKey
          };
          setCurrentLog(newLog);
          setLogHistory(prev => ({
              ...prev,
              [dateKey]: newLog
          }));
      }
  };

  const handlePlannerAddTask = (title: string, size: PickleSize = PickleSize.SAND) => {
    const weekKey = getWeekKey(currentLog.date); 
    
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: TaskStatus.TODO,
      quadrant: Quadrant.Q2, 
      pickleSize: size,
      assignDate: currentLog.date, 
      assignWeek: weekKey 
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE } : t
    ));
  };

  const handleUpdateTask = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleMoveTaskToNextDay = (id: string) => {
      setTasks(prev => {
        const task = prev.find(t => t.id === id);
        if (!task || !task.assignDate) return prev;

        const currentDate = new Date(task.assignDate);
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        const offset = nextDate.getTimezoneOffset();
        const localNextDate = new Date(nextDate.getTime() - (offset*60*1000));
        const nextDateStr = localNextDate.toISOString().split('T')[0];
        const nextWeekKey = getWeekKey(nextDateStr); 

        return prev.map(t => t.id === id ? { 
            ...t, 
            assignDate: nextDateStr,
            assignWeek: nextWeekKey 
        } : t);
      });
  };

  // Feature: Copy Schedule from Yesterday
  const handleCopyYesterdaySchedule = () => {
      if (!window.confirm("Bạn có chắc muốn chép lịch trình từ ngày hôm qua? Dữ liệu lịch trình hiện tại sẽ bị thay thế.")) return;

      const currentDate = new Date(currentLog.date);
      const prevDate = new Date(currentDate);
      prevDate.setDate(currentDate.getDate() - 1);
      
      const offset = prevDate.getTimezoneOffset();
      const localPrevDate = new Date(prevDate.getTime() - (offset*60*1000));
      const prevDateKey = localPrevDate.toISOString().split('T')[0];

      const prevLog = logHistory[prevDateKey];

      if (prevLog && prevLog.schedule) {
          updateCurrentLog({
              ...currentLog,
              schedule: prevLog.schedule.map(s => ({...s})) // Deep copy schedule
          });
          alert("Đã sao chép lịch trình thành công!");
      } else {
          alert("Không tìm thấy dữ liệu lịch trình của ngày hôm qua.");
      }
  };

  // Feature: Manual Save
  const handleManualSave = () => {
      localStorage.setItem('uf_logHistory', JSON.stringify(logHistory));
      localStorage.setItem('uf_tasks', JSON.stringify(tasks));
      localStorage.setItem('uf_goals', JSON.stringify(goals));
      localStorage.setItem('uf_knowledge', JSON.stringify(knowledgeBase));
      alert("Đã lưu dữ liệu thành công!");
  };

  // Feature: Reset App Data
  const handleResetApp = () => {
      if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu của bạn. Bạn có chắc chắn không?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // Filter tasks for the Daily Planner (only show tasks assigned to this date)
  const dailyTasks = tasks.filter(t => t.assignDate === currentLog.date);

  // Calculate deep work from Q2 tasks done today (mock calculation)
  const deepWorkMinutes = dailyTasks
    .filter(t => t.status === TaskStatus.DONE && t.quadrant === Quadrant.Q2)
    .length * 60; 

  // --- SRS: Calculate Due Flashcards for Today ---
  // We check if currentLog.date (the view date) has any due reviews.
  const dueFlashcardsCount = knowledgeBase.reduce((acc, note) => {
      return acc + note.flashcards.filter(card => card.nextReviewDate <= currentLog.date).length;
  }, 0);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Sidebar - Hidden on print */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 no-print">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight">ULTIMATE FLOW</h1>
          <p className="text-xs text-gray-400 mt-1">Hiệu suất mỗi ngày</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'DASHBOARD' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} className="mr-3" /> Tổng quan
          </button>
          
          <button 
            onClick={() => setActiveTab('PLANNER')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'PLANNER' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Calendar size={20} className="mr-3" /> Kế hoạch ngày
          </button>

          <button 
            onClick={() => setActiveTab('LEARNING')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'LEARNING' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen size={20} className="mr-3" /> Góc Học Tập
          </button>

          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase">Công cụ quản lý</div>
          
          <button 
            onClick={() => setActiveTab('EISENHOWER')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'EISENHOWER' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Grid2X2 size={20} className="mr-3" /> Ma trận Eisenhower
          </button>

          <button 
            onClick={() => setActiveTab('RULE_5_25')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'RULE_5_25' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Target size={20} className="mr-3" /> Quy tắc 5/25
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <Pomodoro />
          
          <div className="flex items-center justify-between text-xs text-gray-400 px-2">
             <div className="flex items-center gap-2">
                 <span className="flex items-center" title="Dữ liệu được tự động lưu"><Save size={12} className="mr-1"/> Tự động lưu</span>
                 <button 
                    onClick={handleManualSave}
                    className="bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 px-2 py-0.5 rounded border border-gray-200 transition-colors font-semibold"
                    title="Lưu dữ liệu ngay lập tức"
                 >
                    Lưu ngay
                 </button>
             </div>
             <button 
                onClick={handleResetApp} 
                className="text-red-400 hover:text-red-600 flex items-center"
                title="Xóa dữ liệu & Reset"
            >
                 <RotateCcw size={12} className="mr-1"/> Reset
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
            {activeTab === 'DASHBOARD' && <Dashboard tasks={tasks} deepWorkMinutes={deepWorkMinutes} />}
            
            {activeTab === 'PLANNER' && (
                <DailyPlanner 
                    log={currentLog} 
                    setLog={updateCurrentLog}
                    onDateChange={handleDateChange}
                    tasks={dailyTasks} 
                    goals={goals}
                    onAddTask={handlePlannerAddTask}
                    onToggleTask={handleToggleTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onMoveTaskToNextDay={handleMoveTaskToNextDay}
                    onCopySchedule={handleCopyYesterdaySchedule}
                    dueFlashcardsCount={dueFlashcardsCount}
                    onNavigateToLearning={() => setActiveTab('LEARNING')}
                />
            )}

            {activeTab === 'LEARNING' && (
                <Learning 
                    knowledgeBase={knowledgeBase} 
                    setKnowledgeBase={setKnowledgeBase} 
                />
            )}

            {(activeTab === 'EISENHOWER' || activeTab === 'RULE_5_25') && (
                <div className="space-y-6">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'EISENHOWER' && 'Ma trận Eisenhower (Theo Tuần)'}
                            {activeTab === 'RULE_5_25' && 'Quy tắc 5/25 (Năm)'}
                        </h2>
                        <p className="text-gray-500 text-sm">Quản lý công việc và mục tiêu hiệu quả.</p>
                    </div>
                    <Tools 
                        tasks={tasks} 
                        setTasks={setTasks} 
                        goals={goals} 
                        setGoals={setGoals} 
                        mode={activeTab}
                    />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}