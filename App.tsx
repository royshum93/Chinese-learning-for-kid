
import React, { useState, useEffect, useCallback } from 'react';
import { UNITS } from './constants';
import { Unit, Word } from './types';

const App: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Cantonese TTS
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const cantoneseVoice = voices.find(v => v.lang === 'zh-HK' || v.lang === 'zh-MO' || v.lang.includes('cantonese'));
    
    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
    }
    
    utterance.lang = 'zh-HK';
    utterance.rate = 0.8;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (selectedUnit && !showCelebration) {
      const currentWord = selectedUnit.words[currentIndex];
      speak(currentWord.text);
    }
  }, [selectedUnit, currentIndex, speak, showCelebration]);

  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setCurrentIndex(0);
    setShowCelebration(false);
  };

  const nextCard = () => {
    if (selectedUnit) {
      if (currentIndex < selectedUnit.words.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowCelebration(true);
      }
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goHome = () => {
    setSelectedUnit(null);
    setCurrentIndex(0);
    setShowCelebration(false);
  };

  const goToNextUnit = () => {
    if (selectedUnit) {
      const currentUnitIndex = UNITS.findIndex(u => u.id === selectedUnit.id);
      const nextUnitIndex = (currentUnitIndex + 1) % UNITS.length;
      handleUnitSelect(UNITS[nextUnitIndex]);
    }
  };

  if (!selectedUnit) {
    return (
      <div className="h-screen w-screen bg-yellow-50 flex flex-col overflow-hidden font-['Noto_Sans_TC']">
        <header className="pt-6 pb-2 text-center flex-shrink-0">
          <h1 className="text-3xl md:text-5xl font-extrabold text-orange-600 mb-1 drop-shadow-sm">廣東話認字樂園 🎡</h1>
          <p className="text-base md:text-xl text-gray-600 font-medium px-4">小朋友，想學哪一個單元？</p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl mx-auto">
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => handleUnitSelect(unit)}
                className={`${unit.color} hover:scale-105 transition-transform duration-200 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-lg flex flex-col items-center justify-center text-white border-4 border-white aspect-square sm:aspect-auto`}
              >
                <span className="text-5xl md:text-7xl mb-3">{unit.icon}</span>
                <span className="text-lg md:text-2xl font-black">{unit.title}</span>
                <span className="mt-2 text-xs font-bold bg-black/10 px-3 py-1 rounded-full">{unit.words.length} 個字詞</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentWord = selectedUnit.words[currentIndex];

  return (
    <div className="h-screen w-screen bg-white flex flex-col select-none overflow-hidden p-2 md:p-4 font-['Noto_Sans_TC']">
      {/* Top Bar */}
      <div className="w-full max-w-2xl mx-auto flex justify-between items-center h-12 md:h-16 flex-shrink-0">
        <button 
          onClick={goHome}
          className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors font-black text-xs md:text-lg shadow-sm"
        >
          🏠 <span className="hidden xs:inline">返回</span>
        </button>
        <div className="flex flex-col items-center flex-1 mx-2">
          <span className="text-[10px] md:text-lg font-black text-gray-400 truncate max-w-[120px] md:max-w-[200px] uppercase">{selectedUnit.title}</span>
          <div className="flex gap-0.5 md:gap-1 mt-0.5 md:mt-1 overflow-hidden max-w-full justify-center">
             {selectedUnit.words.map((_, idx) => (
               <div key={idx} className={`h-1 md:h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-orange-500 w-3 md:w-6' : 'bg-gray-200 w-1 md:w-2'}`} />
             ))}
          </div>
        </div>
        <div className="bg-orange-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-xl font-black text-[10px] md:text-lg shadow-md whitespace-nowrap">
           {currentIndex + 1} / {selectedUnit.words.length}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-1 md:py-2">
        {showCelebration ? (
          <div className="w-full h-full bg-orange-100 rounded-[2rem] md:rounded-[4rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
             <span className="text-8xl md:text-9xl mb-6">🎉🌟🎖️</span>
             <h3 className="text-3xl md:text-5xl font-black text-orange-600 mb-4">太棒了！</h3>
             <p className="text-xl md:text-2xl text-gray-700 font-bold mb-8">你完成了「{selectedUnit.title}」</p>
             <div className="flex flex-col gap-4 w-full max-w-xs">
                <button 
                  onClick={goToNextUnit}
                  className="bg-orange-500 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl text-xl md:text-3xl font-black shadow-xl hover:bg-orange-600 active:scale-95 transition-all"
                >
                  下一個單元 ⏭️
                </button>
                <button 
                  onClick={goHome}
                  className="bg-white text-gray-500 py-3 md:py-4 rounded-2xl md:rounded-3xl text-lg md:text-xl font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all"
                >
                  回主選單 🏠
                </button>
             </div>
          </div>
        ) : (
          <div 
            className="w-full h-full bg-orange-50 rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-[4px] md:border-[12px] border-orange-100 flex flex-col cursor-pointer"
            onClick={() => speak(currentWord.text)}
          >
            {/* Emoji Area */}
            <div className="flex-[3] flex items-center justify-center p-4 min-h-0">
              <span className="text-[min(22vh,32vw)] leading-none drop-shadow-xl select-none transition-transform active:scale-90 duration-200">
                {currentWord.emoji}
              </span>
            </div>

            {/* Text Area */}
            <div className="flex-[2] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center border-t-2 md:border-t-8 border-orange-100 min-h-0 p-2">
               <h2 className="text-[min(9vh,14vw)] font-black text-gray-900 tracking-widest leading-none mb-1 md:mb-2 drop-shadow-sm text-center">
                 {currentWord.text}
               </h2>
               <button 
                  className={`w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isSpeaking ? 'bg-orange-500 scale-110' : 'bg-white hover:bg-gray-50 active:scale-90'}`}
                  onClick={(e) => { e.stopPropagation(); speak(currentWord.text); }}
               >
                  <span className="text-xl md:text-4xl">{isSpeaking ? '🔊' : '🔈'}</span>
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {!showCelebration && (
        <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-3 h-16 md:h-24 flex-shrink-0 pt-1 md:pt-2">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className={`rounded-xl md:rounded-[2.5rem] text-sm md:text-3xl font-black flex items-center justify-center transition-all border-b-2 md:border-b-8 active:border-b-0 active:translate-y-1 ${currentIndex === 0 ? 'bg-gray-100 border-gray-200 text-gray-300' : 'bg-orange-100 border-orange-200 text-orange-600 hover:bg-orange-200 shadow-sm'}`}
          >
            ⬅️ <span className="ml-1">上一個</span>
          </button>
          <button
            onClick={nextCard}
            className={`rounded-xl md:rounded-[2.5rem] text-sm md:text-3xl font-black flex items-center justify-center transition-all border-b-2 md:border-b-8 active:border-b-0 active:translate-y-1 bg-orange-500 border-orange-700 text-white hover:bg-orange-600 shadow-lg shadow-orange-100`}
          >
            <span className="mr-1">{currentIndex === selectedUnit.words.length - 1 ? '完成！✨' : '下一個'}</span> ➡️
          </button>
        </div>
      )}
      
      {/* Voice Warning */}
      {!window.speechSynthesis.getVoices().some(v => v.lang.includes('zh-HK')) && !showCelebration && (
        <p className="text-[8px] md:text-[10px] text-gray-400 h-3 md:h-4 flex-shrink-0 text-center overflow-hidden">建議使用 Chrome 瀏覽器獲得最佳廣東話效果</p>
      )}
    </div>
  );
};

export default App;
