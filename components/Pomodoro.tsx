import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const Pomodoro: React.FC = () => {
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Use a ref for the audio to avoid re-creation
  // In a real app, use a real sound file url
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound
      if(audioRef.current) audioRef.current.play().catch(() => {});
      
      if (mode === 'FOCUS') {
        alert("Hoàn thành phiên làm việc! Hãy nghỉ ngơi 5 phút.");
        setMode('BREAK');
        setTimeLeft(5 * 60);
      } else {
        alert("Hết giờ nghỉ! Quay lại làm việc nào.");
        setMode('FOCUS');
        setTimeLeft(25 * 60);
      }
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center w-full max-w-xs mx-auto">
      <h3 className="text-lg font-bold text-gray-700 mb-2">
        {mode === 'FOCUS' ? '🍅 Tập trung' : '☕ Nghỉ ngơi'}
      </h3>
      <div className="text-5xl font-mono font-bold text-indigo-600 mb-4">
        {formatTime(timeLeft)}
      </div>
      <div className="flex space-x-3">
        <button
          onClick={toggleTimer}
          className={`p-3 rounded-full text-white transition-colors ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
        >
          <RotateCcw size={24} />
        </button>
      </div>
      <div className="mt-4 flex space-x-2 text-sm">
        <button 
            onClick={() => { setMode('FOCUS'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={`px-3 py-1 rounded-md ${mode === 'FOCUS' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500'}`}
        >
            25 Phút
        </button>
        <button 
            onClick={() => { setMode('BREAK'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={`px-3 py-1 rounded-md ${mode === 'BREAK' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500'}`}
        >
            5 Phút
        </button>
      </div>
    </div>
  );
};