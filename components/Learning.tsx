
import React, { useState } from 'react';
import { KnowledgeNote, Flashcard, SRS_INTERVALS } from '../types';
import { Plus, BookOpen, Brain, ChevronRight, RotateCcw, Check, Trash2, Edit2, Search, X, Calendar } from 'lucide-react';

interface LearningProps {
    knowledgeBase: KnowledgeNote[];
    setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeNote[]>>;
}

export const Learning: React.FC<LearningProps> = ({ knowledgeBase, setKnowledgeBase }) => {
    const [view, setView] = useState<'LIBRARY' | 'REVIEW'>('LIBRARY');
    const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
    const [isEditingNote, setIsEditingNote] = useState(false);
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Note State
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteCategory, setNewNoteCategory] = useState('');

    // Review Session State
    const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    // --- LOGIC: LIBRARY & NOTES ---

    const handleAddNote = () => {
        if (!newNoteTitle.trim()) return;
        const newNote: KnowledgeNote = {
            id: Date.now().toString(),
            title: newNoteTitle,
            content: '',
            category: newNoteCategory || 'General',
            createdAt: todayStr,
            flashcards: []
        };
        setKnowledgeBase([newNote, ...knowledgeBase]);
        setNewNoteTitle('');
        setNewNoteCategory('');
        setSelectedNote(newNote); // Auto open
        setIsEditingNote(true);
    };

    const handleDeleteNote = (id: string) => {
        if (window.confirm("Bạn có chắc muốn xóa ghi chú này và toàn bộ thẻ nhớ của nó?")) {
            setKnowledgeBase(knowledgeBase.filter(n => n.id !== id));
            if (selectedNote?.id === id) {
                setSelectedNote(null);
                setIsEditingNote(false);
            }
        }
    };

    const handleUpdateNoteContent = (content: string) => {
        if (selectedNote) {
            const updated = { ...selectedNote, content };
            setSelectedNote(updated);
            setKnowledgeBase(knowledgeBase.map(n => n.id === selectedNote.id ? updated : n));
        }
    };

    // --- LOGIC: FLASHCARDS ---

    const addFlashcard = (question: string, answer: string) => {
        if (!selectedNote || !question.trim() || !answer.trim()) return;
        const newCard: Flashcard = {
            id: Date.now().toString(),
            question,
            answer,
            stage: 0,
            nextReviewDate: todayStr // Review immediately (or tomorrow)
        };
        const updatedNote = { ...selectedNote, flashcards: [...selectedNote.flashcards, newCard] };
        setSelectedNote(updatedNote);
        setKnowledgeBase(knowledgeBase.map(n => n.id === selectedNote.id ? updatedNote : n));
    };

    const deleteFlashcard = (cardId: string) => {
        if (!selectedNote) return;
        const updatedNote = { ...selectedNote, flashcards: selectedNote.flashcards.filter(c => c.id !== cardId) };
        setSelectedNote(updatedNote);
        setKnowledgeBase(knowledgeBase.map(n => n.id === selectedNote.id ? updatedNote : n));
    };

    // --- LOGIC: REVIEW SESSION ---

    const startReview = () => {
        // Collect all due cards
        const dueCards: Flashcard[] = [];
        knowledgeBase.forEach(note => {
            note.flashcards.forEach(card => {
                if (card.nextReviewDate <= todayStr) {
                    // Attach noteId to card temporarily for finding it later could be useful, 
                    // but for now we iterate KB to update.
                    dueCards.push(card); 
                }
            });
        });
        
        if (dueCards.length === 0) {
            alert("Không có thẻ nào cần ôn tập hôm nay!");
            return;
        }

        setReviewQueue(dueCards);
        setCurrentReviewIndex(0);
        setIsFlipped(false);
        setSessionComplete(false);
        setView('REVIEW');
    };

    const processReview = (success: boolean) => {
        const currentCard = reviewQueue[currentReviewIndex];
        
        // Calculate new stage and date
        let newStage = currentCard.stage;
        let nextDate = new Date();

        if (success) {
            // Increase stage, cap at max intervals length
            newStage = Math.min(currentCard.stage + 1, SRS_INTERVALS.length);
            // Calculate days to add: if stage is max, add 30 days (or more)
            const daysToAdd = newStage >= SRS_INTERVALS.length ? 60 : SRS_INTERVALS[newStage - 1]; // -1 because stage starts at 0 or 1 logic
            // Let's stick to simple logic: Stage 0 (New) -> Stage 1 (1 day).
            // Indexing: Intervals[0] is 1 day.
            const days = newStage === 0 ? 1 : SRS_INTERVALS[Math.min(newStage - 1, SRS_INTERVALS.length - 1)];
            
            nextDate.setDate(nextDate.getDate() + days);
        } else {
            // Reset to 0 (or 1)
            newStage = 0;
            nextDate.setDate(nextDate.getDate() + 1); // Review tomorrow
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Update in DB
        const updatedKB = knowledgeBase.map(note => {
            const cardIndex = note.flashcards.findIndex(c => c.id === currentCard.id);
            if (cardIndex === -1) return note;

            const updatedCards = [...note.flashcards];
            updatedCards[cardIndex] = {
                ...currentCard,
                stage: newStage,
                nextReviewDate: nextDateStr,
                lastReviewed: todayStr
            };
            return { ...note, flashcards: updatedCards };
        });

        setKnowledgeBase(updatedKB);

        // Move to next
        if (currentReviewIndex < reviewQueue.length - 1) {
            setCurrentReviewIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            setSessionComplete(true);
        }
    };

    // Calculate Stats
    const totalNotes = knowledgeBase.length;
    const totalCards = knowledgeBase.reduce((acc, n) => acc + n.flashcards.length, 0);
    const dueCount = knowledgeBase.reduce((acc, n) => acc + n.flashcards.filter(c => c.nextReviewDate <= todayStr).length, 0);

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-gray-500 text-xs font-bold uppercase">Tổng kiến thức</div>
                        <div className="text-2xl font-bold text-gray-800">{totalNotes} Note / {totalCards} Card</div>
                    </div>
                    <BookOpen size={24} className="text-indigo-500"/>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-gray-500 text-xs font-bold uppercase">Cần ôn tập hôm nay</div>
                        <div className="text-2xl font-bold text-red-600">{dueCount} thẻ</div>
                    </div>
                    <Brain size={24} className="text-red-500"/>
                </div>
                <button 
                    onClick={startReview}
                    disabled={dueCount === 0}
                    className={`p-4 rounded-xl shadow-sm border flex items-center justify-center font-bold text-lg transition-all ${dueCount > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                >
                    {dueCount > 0 ? '🚀 Bắt đầu ôn tập ngay' : '✅ Đã hoàn thành'}
                </button>
            </div>

            {view === 'REVIEW' && (
                <div className="max-w-2xl mx-auto mt-10">
                     <button onClick={() => setView('LIBRARY')} className="mb-4 text-gray-500 hover:text-gray-800 flex items-center"><ChevronRight className="rotate-180 mr-1" size={16}/> Quay lại thư viện</button>
                     
                     {!sessionComplete ? (
                         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 min-h-[400px] flex flex-col relative">
                            {/* Progress Bar */}
                            <div className="h-1 bg-gray-100 w-full">
                                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentReviewIndex + 1) / reviewQueue.length) * 100}%` }}></div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center cursor-pointer" onClick={() => !isFlipped && setIsFlipped(true)}>
                                <div className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">
                                    Thẻ {currentReviewIndex + 1} / {reviewQueue.length}
                                </div>
                                
                                <div className="text-2xl font-medium text-gray-800 mb-6">
                                    {reviewQueue[currentReviewIndex].question}
                                </div>

                                {isFlipped ? (
                                    <div className="animate-fade-in w-full">
                                        <div className="border-t border-gray-100 my-6"></div>
                                        <div className="text-xl text-indigo-700 font-bold mb-8 bg-indigo-50 p-4 rounded-lg">
                                            {reviewQueue[currentReviewIndex].answer}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); processReview(false); }}
                                                className="py-3 px-6 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-colors flex items-center justify-center"
                                            >
                                                <X size={20} className="mr-2"/> Quên / Khó
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); processReview(true); }}
                                                className="py-3 px-6 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-colors flex items-center justify-center"
                                            >
                                                <Check size={20} className="mr-2"/> Đã nhớ / Dễ
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 mt-8 animate-pulse">
                                        Bấm vào thẻ để xem đáp án
                                    </div>
                                )}
                            </div>
                         </div>
                     ) : (
                         <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
                             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <Check size={40} strokeWidth={4} />
                             </div>
                             <h2 className="text-2xl font-bold text-gray-800 mb-2">Tuyệt vời!</h2>
                             <p className="text-gray-500 mb-6">Bạn đã hoàn thành phiên ôn tập hôm nay.</p>
                             <button onClick={() => setView('LIBRARY')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">
                                 Quay về thư viện
                             </button>
                         </div>
                     )}
                </div>
            )}

            {view === 'LIBRARY' && (
                <div className="flex gap-6 h-[calc(100vh-200px)]">
                    {/* Left: Note List */}
                    <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-3">Thư viện của bạn</h3>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-indigo-400"
                                    placeholder="Tìm kiếm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-2 custom-scrollbar">
                            {knowledgeBase
                                .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(note => (
                                <div 
                                    key={note.id} 
                                    onClick={() => { setSelectedNote(note); setIsEditingNote(true); }}
                                    className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedNote?.id === note.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                                >
                                    <div className="font-bold text-gray-800 text-sm mb-1">{note.title}</div>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{note.category}</span>
                                        <span>{note.flashcards.length} thẻ</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                            <div className="space-y-2">
                                <input 
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                                    placeholder="Tên bài học mới..."
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                                        placeholder="Danh mục (VD: Marketing)"
                                        value={newNoteCategory}
                                        onChange={(e) => setNewNoteCategory(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleAddNote}
                                        className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
                                    >
                                        <Plus size={20}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Editor */}
                    <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden">
                        {selectedNote ? (
                            <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div className="flex-1">
                                    <input 
                                        value={selectedNote.title}
                                        onChange={(e) => {
                                            const updated = { ...selectedNote, title: e.target.value };
                                            setSelectedNote(updated);
                                            setKnowledgeBase(knowledgeBase.map(n => n.id === updated.id ? updated : n));
                                        }}
                                        className="text-2xl font-bold bg-transparent outline-none w-full text-gray-800 placeholder-gray-400"
                                        placeholder="Tiêu đề bài học..."
                                    />
                                    <div className="text-xs text-gray-400 mt-1 flex items-center">
                                        <Calendar size={12} className="mr-1"/> Tạo ngày: {selectedNote.createdAt}
                                        <span className="mx-2">•</span>
                                        <span className="bg-white border border-gray-200 px-2 rounded-full">{selectedNote.category}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteNote(selectedNote.id)} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={20}/></button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                                {/* Main Content Area */}
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nội dung / Lý thuyết chính</label>
                                    <textarea 
                                        className="w-full min-h-[150px] p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-gray-700 leading-relaxed outline-none resize-none focus:ring-2 focus:ring-yellow-200"
                                        placeholder="Ghi chép lại kiến thức chính tại đây..."
                                        value={selectedNote.content}
                                        onChange={(e) => handleUpdateNoteContent(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Flashcards Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase">Flashcards (Hỏi - Đáp)</label>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{selectedNote.flashcards.length} thẻ</span>
                                    </div>

                                    {/* Add Card Form */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <input id="q-input" className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Mặt trước (Câu hỏi)..." />
                                            <input id="a-input" className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Mặt sau (Đáp án)..." 
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const q = (document.getElementById('q-input') as HTMLInputElement).value;
                                                        const a = (document.getElementById('a-input') as HTMLInputElement).value;
                                                        addFlashcard(q, a);
                                                        (document.getElementById('q-input') as HTMLInputElement).value = '';
                                                        (document.getElementById('a-input') as HTMLInputElement).value = '';
                                                        document.getElementById('q-input')?.focus();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const q = (document.getElementById('q-input') as HTMLInputElement).value;
                                                const a = (document.getElementById('a-input') as HTMLInputElement).value;
                                                addFlashcard(q, a);
                                                (document.getElementById('q-input') as HTMLInputElement).value = '';
                                                (document.getElementById('a-input') as HTMLInputElement).value = '';
                                                document.getElementById('q-input')?.focus();
                                            }}
                                            className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded hover:bg-indigo-700 flex items-center justify-center"
                                        >
                                            <Plus size={16} className="mr-1"/> Thêm thẻ nhớ
                                        </button>
                                    </div>

                                    {/* Card List */}
                                    <div className="space-y-3">
                                        {selectedNote.flashcards.map((card, idx) => (
                                            <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center group hover:shadow-sm">
                                                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                                    <div className="font-medium text-gray-800 pl-2 border-l-2 border-indigo-500">{card.question}</div>
                                                    <div className="text-gray-600 border-l border-gray-100 pl-2">{card.answer}</div>
                                                </div>
                                                <div className="flex items-center space-x-4 ml-4">
                                                    <div className="text-xs text-center text-gray-400">
                                                        <div className="font-bold">Stage {card.stage}</div>
                                                        <div>{card.nextReviewDate}</div>
                                                    </div>
                                                    <button onClick={() => deleteFlashcard(card.id)} className="text-gray-300 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                                <BookOpen size={64} className="mb-4 text-gray-200"/>
                                <p>Chọn một bài học để xem chi tiết hoặc tạo mới.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
