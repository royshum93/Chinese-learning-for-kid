
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UNITS } from './constants';
import { Unit, Word } from './types';

type ViewMode = 'main_menu' | 'unit_selection' | 'learn' | 'exercise' | 'result';
type AppMode = 'learn' | 'exercise';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('main_menu');
  const [appMode, setAppMode] = useState<AppMode>('learn');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Exercise specific state
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizOptions, setQuizOptions] = useState<Word[]>([]);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Sound Feedback (Correct/Incorrect) using Web Audio API
  const playFeedbackSound = useCallback((isCorrect: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (isCorrect) {
        // High pitched pleasant "ding"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } else {
        // Lower pitched "thud"
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2); // A2
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio context failed to start", e);
    }
  }, []);

  // Cantonese TTS
  const speak = useCallback((text: string, onEnd?: () => void) => {
    // Only speak in Learn mode
    if (appMode !== 'learn') return;
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const cantoneseVoice = voices.find(v => v.lang === 'zh-HK' || v.lang === 'zh-MO' || v.lang.includes('cantonese'));
    
    if (cantoneseVoice) utterance.voice = cantoneseVoice;
    utterance.lang = 'zh-HK';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  }, [appMode]);

  // Generate randomized options for quiz
  const generateOptions = useCallback((correctWord: Word, unit: Unit) => {
    const distractors = unit.words
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  }, []);

  // Task Initialization
  const startTask = (unit: Unit) => {
    setSelectedUnit(unit);
    setCurrentIndex(0);
    if (appMode === 'learn') {
      setView('learn');
      setShowCelebration(false);
      // Auto speak first word in learn mode
      setTimeout(() => speak(unit.words[0].text), 300);
    } else {
      const shuffled = [...unit.words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      setQuizScore(0);
      setView('exercise');
      setAnsweredCorrectly(null);
      setSelectedOptionId(null);
      generateOptions(shuffled[0], unit);
    }
  };

  const goHome = () => {
    setView('main_menu');
    setSelectedUnit(null);
    setShowCelebration(false);
  };

  const nextCard = () => {
    if (selectedUnit) {
      if (currentIndex < selectedUnit.words.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        speak(selectedUnit.words[nextIdx].text);
      } else {
        setShowCelebration(true);
      }
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (selectedUnit) speak(selectedUnit.words[prevIdx].text);
    }
  };

  const handleAnswer = (option: Word) => {
    if (answeredCorrectly !== null || !selectedUnit) return;
    
    const isCorrect = option.id === shuffledWords[currentIndex].id;
    setSelectedOptionId(option.id);
    setAnsweredCorrectly(isCorrect);
    
    // Play sound feedback
    playFeedbackSound(isCorrect);
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      setTimeout(proceedQuiz, 800);
    } else {
      setTimeout(() => {
        setAnsweredCorrectly(null);
        setSelectedOptionId(null);
      }, 1000);
    }
  };

  const proceedQuiz = () => {
    if (!selectedUnit) return;
    if (currentIndex < shuffledWords.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setAnsweredCorrectly(null);
      setSelectedOptionId(null);
      generateOptions(shuffledWords[nextIdx], selectedUnit);
    } else {
      setView('result');
    }
  };

  const goToNextUnit = () => {
    if (selectedUnit) {
      const currentUnitIdx = UNITS.findIndex(u => u.id === selectedUnit.id);
      const nextUnit = UNITS[(currentUnitIdx + 1) % UNITS.length];
      startTask(nextUnit);
    }
  };

  // --- Views ---

  // 1. Main Menu Mode Selection
  if (view === 'main_menu') {
    return (
      <div className="h-screen w-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center font-['Noto_Sans_TC'] overflow-hidden">
        <h1 className="text-3xl md:text-5xl font-black text-green-600 mb-2 drop-shadow-sm">廣東話認字樂園 🎡</h1>
        <p className="text-lg md:text-xl text-gray-600 font-bold mb-6">小朋友，今日想玩咩呀？</p>
        
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl px-4">
          <button 
            onClick={() => { setAppMode('learn'); setView('unit_selection'); }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl transition-all active:scale-95 flex flex-col items-center border-b-4 border-blue-700"
          >
            <span className="text-5xl md:text-6xl mb-2">📖</span>
            <span className="text-xl md:text-2xl font-black">我要學習</span>
            <span className="mt-1 text-sm opacity-80">聽發音，認字詞</span>
          </button>
          
          <button 
            onClick={() => { setAppMode('exercise'); setView('unit_selection'); }}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-[2rem] shadow-xl transition-all active:scale-95 flex flex-col items-center border-b-4 border-orange-700"
          >
            <span className="text-5xl md:text-6xl mb-2">🎯</span>
            <span className="text-xl md:text-2xl font-black">挑戰練習</span>
            <span className="mt-1 text-sm opacity-80">配對圖畫，考考你</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Unit Selection View (Extra compact for zero-scroll)
  if (view === 'unit_selection') {
    return (
      <div className="h-screen w-screen bg-white flex flex-col overflow-hidden font-['Noto_Sans_TC']">
        <header className="pt-2 pb-1 text-center flex-shrink-0 relative">
          <button onClick={goHome} className="absolute left-4 top-2 text-2xl hover:scale-110 transition-transform bg-indigo-500 p-2 rounded-full text-white shadow-md">🏠</button>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-700">
            {appMode === 'learn' ? '📖 學習單元' : '🎯 挑戰單元'}
          </h1>
          <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">請選擇主題</p>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-4xl mx-auto pt-2">
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => startTask(unit)}
                className={`${unit.color} hover:shadow-lg hover:scale-[1.02] transition-all p-2 rounded-2xl shadow-sm flex flex-col items-center justify-center text-white border-4 border-white aspect-square`}
              >
                <span className="text-3xl md:text-4xl mb-1">{unit.icon}</span>
                <span className="text-xs md:text-sm font-black leading-tight text-center px-1">
                  {unit.title.split('：')[1]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Learn View
  if (view === 'learn' && selectedUnit) {
    const currentWord = selectedUnit.words[currentIndex];
    return (
      <div className="h-screen w-screen bg-white flex flex-col select-none overflow-hidden p-2 md:p-4 font-['Noto_Sans_TC']">
        <div className="w-full max-w-2xl mx-auto flex justify-between items-center h-10 md:h-12 flex-shrink-0">
          <button onClick={() => setView('unit_selection')} className="px-3 py-1 bg-indigo-500 text-white rounded-full font-black text-xs shadow-sm active:scale-95">⬅️ 返回</button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase">{selectedUnit.title}</span>
            <div className="flex gap-1 mt-1">
               {selectedUnit.words.map((_, idx) => (
                 <div key={idx} className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'bg-blue-500 w-3' : 'bg-gray-200 w-1'}`} />
               ))}
            </div>
          </div>
          <div className="bg-blue-500 text-white px-2 py-0.5 rounded-lg font-black text-[10px]">{currentIndex + 1} / {selectedUnit.words.length}</div>
        </div>

        <div className="flex-1 min-h-0 w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-2">
          {showCelebration ? (
            <div className="w-full h-full bg-blue-50 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
              <span className="text-8xl mb-4">🎉</span>
              <h3 className="text-3xl font-black text-blue-600 mb-2">學習完成！</h3>
              <p className="text-lg font-bold text-gray-600 mb-6">而家去挑戰下練習囉？</p>
              <button onClick={() => { setAppMode('exercise'); startTask(selectedUnit); }} className="bg-orange-500 text-white px-10 py-4 rounded-2xl text-xl font-black shadow-lg">開始挑戰 🎯</button>
            </div>
          ) : (
            <div 
              className="w-full h-full bg-blue-50 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-blue-100 flex flex-col cursor-pointer"
              onClick={() => speak(currentWord.text)}
            >
              <div className="flex-[3] flex items-center justify-center"><span className="text-[20vh] leading-none drop-shadow-lg">{currentWord.emoji}</span></div>
              <div className="flex-[2] bg-white flex flex-col items-center justify-center border-t-4 border-blue-100">
                <h2 className="text-[8vh] font-black text-gray-900 tracking-widest leading-none mb-4">{currentWord.text}</h2>
                <button className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${isSpeaking ? 'bg-blue-500 scale-110' : 'bg-gray-100 active:scale-90'}`}>
                  <span className="text-2xl">{isSpeaking ? '🔊' : '🔈'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {!showCelebration && (
          <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-3 h-16 flex-shrink-0 pt-1 pb-1">
            <button onClick={prevCard} disabled={currentIndex === 0} className="rounded-xl bg-indigo-400 text-white font-black text-lg disabled:opacity-30 active:scale-95 transition-transform shadow-md">上一個</button>
            <button onClick={nextCard} className="rounded-xl bg-blue-500 text-white font-black text-lg active:scale-95 transition-transform shadow-md">{currentIndex === selectedUnit.words.length - 1 ? '完成 ✨' : '下一個'}</button>
          </div>
        )}
      </div>
    );
  }

  // 4. Exercise View (Random sequence, sound feedback, no speech)
  if (view === 'exercise' && selectedUnit) {
    const currentWord = shuffledWords[currentIndex];
    return (
      <div className="h-screen w-screen bg-orange-50 flex flex-col overflow-hidden p-2 md:p-4 font-['Noto_Sans_TC']">
        <div className="w-full max-w-2xl mx-auto flex justify-between items-center h-10 md:h-12 flex-shrink-0">
          <button onClick={() => setView('unit_selection')} className="px-3 py-1 bg-indigo-500 text-white rounded-full font-black text-xs shadow-md active:scale-95">放棄</button>
          <div className="bg-white px-3 py-1 rounded-full font-black text-orange-600 shadow-sm text-sm border-2 border-orange-100">得分：{quizScore}</div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-2">
          <div className="bg-white w-full rounded-[2rem] shadow-lg p-5 mb-3 flex flex-col items-center border-b-4 border-orange-200">
            <p className="text-sm md:text-lg font-bold text-gray-400 mb-1">邊張圖先至係：</p>
            <h2 className="text-6xl md:text-8xl font-black text-orange-600 tracking-widest py-1 drop-shadow-sm leading-tight">{currentWord?.text}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full flex-1 min-h-0">
            {quizOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                disabled={answeredCorrectly !== null}
                className={`
                  relative rounded-[1.5rem] text-6xl md:text-7xl flex items-center justify-center transition-all duration-300 shadow-md border-2
                  ${selectedOptionId === option.id 
                    ? (answeredCorrectly ? 'bg-green-400 border-green-500 scale-105 z-10' : 'bg-red-400 border-red-500 scale-95 opacity-50')
                    : 'bg-white border-transparent hover:border-orange-200 active:scale-95'}
                `}
              >
                <span className="drop-shadow-sm">{option.emoji}</span>
                {selectedOptionId === option.id && (
                  <div className={`absolute top-2 right-2 text-2xl ${answeredCorrectly ? 'animate-bounce' : 'animate-shake'}`}>
                    {answeredCorrectly ? '✅' : '❌'}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="h-2.5 w-full max-w-2xl mx-auto bg-gray-200 rounded-full mb-2 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-orange-500 transition-all duration-500 rounded-full" 
            style={{ width: `${(currentIndex / shuffledWords.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // 5. Result View
  if (view === 'result' && selectedUnit) {
    const ratio = quizScore / selectedUnit.words.length;
    let stars = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio > 0 ? 1 : 0;

    return (
      <div className="h-screen w-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center font-['Noto_Sans_TC'] overflow-hidden">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-md w-full border-4 border-green-100">
          <h2 className="text-2xl font-black text-gray-800 mb-2">挑戰完成！🎉</h2>
          
          <div className="flex gap-1 mb-4">
            {[1, 2, 3].map(i => (
              <span key={i} className={`text-5xl md:text-6xl transition-all duration-700 ${i <= stars ? 'grayscale-0 scale-110 animate-bounce' : 'grayscale opacity-20 scale-90'}`}>
                ⭐
              </span>
            ))}
          </div>
          
          <p className="text-2xl font-black text-gray-700 mb-1">得分：{quizScore} / {selectedUnit.words.length}</p>
          <p className="text-base font-bold text-gray-500 mb-6">
            {quizScore === selectedUnit.words.length ? '滿分呀！你真係天才！🦁' : '做得好！下次再努力呀！💪'}
          </p>
          
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => startTask(selectedUnit)}
              className="bg-orange-500 text-white p-4 rounded-2xl text-lg font-black shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              再挑戰一次 🔄
            </button>
            <button 
              onClick={goToNextUnit}
              className="bg-blue-500 text-white p-4 rounded-2xl text-lg font-black shadow-lg border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              下一個單元 ➡️
            </button>
            <button 
              onClick={goHome}
              className="bg-indigo-500 text-white p-3 rounded-2xl text-base font-black shadow-lg hover:bg-indigo-600 active:scale-95 transition-all"
            >
              返主頁 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
