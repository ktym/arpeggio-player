import { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { NotationPlayer } from './components/NotationPlayer';
import type { Instrument, ArpeggioDirection } from './utils/musicEngine';
import { parseChordProgression, generateABC, analyzeScales, generateScaleABC } from './utils/musicEngine';

import './index.css';

function App() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [chordsInput, setChordsInput] = useState<string>("Dm7 G7 | Cmaj7");
  const [rhythmPattern, setRhythmPattern] = useState<string>("x-xx-x-x-x-xx-x-");
  const [instrument, setInstrument] = useState<Instrument>("Bb");
  const [direction, setDirection] = useState<ArpeggioDirection>("up");
  const [title, setTitle] = useState<string>("Arpeggio Practice");
  const [playbackProgram, setPlaybackProgram] = useState<number>(66);
  const [visualOctaveOffset, setVisualOctaveOffset] = useState<number>(1);
  const [playAccompaniment, setPlayAccompaniment] = useState<boolean>(true);
  const [selectedScale, setSelectedScale] = useState<string | null>(null);

  const [visualAbcString, setVisualAbcString] = useState<string>("");
  const [audioAbcString, setAudioAbcString] = useState<string>("");
  const [scaleAbcString, setScaleAbcString] = useState<string>("");
  const [scales, setScales] = useState<string[]>([]);
  const [randomSeed, setRandomSeed] = useState<number>(Date.now());

  useEffect(() => {
    if (direction === 'random' || direction === 'root3') {
      setRandomSeed(Date.now());
    }
  }, [direction]);

  useEffect(() => {
    try {
      const parsed = parseChordProgression(chordsInput);
      
      const visualAbc = generateABC(parsed, rhythmPattern, instrument, direction, title, playbackProgram, visualOctaveOffset, false, randomSeed);
      setVisualAbcString(visualAbc);

      const audioAbc = generateABC(parsed, rhythmPattern, instrument, direction, title, playbackProgram, visualOctaveOffset, playAccompaniment, randomSeed);
      setAudioAbcString(audioAbc);
      
      setScales(analyzeScales(parsed));

      if (selectedScale) {
        setScaleAbcString(generateScaleABC(selectedScale, instrument, playbackProgram, visualOctaveOffset));
      }
    } catch (e) {
      console.error("Error generating ABC:", e);
    }
  }, [chordsInput, rhythmPattern, instrument, direction, title, playbackProgram, selectedScale, visualOctaveOffset, playAccompaniment, randomSeed]);

  return (
    <div className="container">
      <header style={{ position: 'relative' }}>
        <button 
          onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')} 
          style={{ position: 'absolute', right: 0, top: 0, padding: '0.4rem 0.8rem', background: 'var(--panel-bg)', fontSize: '0.8rem' }}
        >
          {lang === 'ja' ? 'English' : '日本語'}
        </button>
        <h1>Arpeggio Player</h1>
        <p>{lang === 'ja' ? 'サックス向けアルペジオ練習ツール' : 'Interactive tool for practicing chord arpeggios on saxophone.'}</p>
      </header>

      <main>
        <InputSection 
          lang={lang}
          chordsInput={chordsInput}
          setChordsInput={setChordsInput}
          rhythmPattern={rhythmPattern}
          setRhythmPattern={setRhythmPattern}
          instrument={instrument}
          setInstrument={setInstrument}
          direction={direction}
          setDirection={setDirection}
          title={title}
          setTitle={setTitle}
          playbackProgram={playbackProgram}
          setPlaybackProgram={setPlaybackProgram}
          visualOctaveOffset={visualOctaveOffset}
          setVisualOctaveOffset={setVisualOctaveOffset}
          playAccompaniment={playAccompaniment}
          setPlayAccompaniment={setPlayAccompaniment}
          onShuffle={() => setRandomSeed(Date.now())}
        />

        <NotationPlayer visualAbc={visualAbcString} audioAbc={audioAbcString} lang={lang} playAccompaniment={playAccompaniment} />

        {scales.length > 0 && (
          <div className="panel" style={{ marginTop: '1.5rem' }}>
            <h2>{lang === 'ja' ? '使用可能なスケール (クリックで表示)' : 'Suggested Scales (Click to display notation)'}</h2>
            <div>
              {scales.map(scale => (
                <span 
                  key={scale} 
                  className={`badge ${selectedScale === scale ? 'selected' : ''}`}
                  style={{ cursor: 'pointer', opacity: selectedScale === scale ? 1 : 0.6, border: selectedScale === scale ? '1px solid var(--accent-color)' : 'none' }}
                  onClick={() => setSelectedScale(scale === selectedScale ? null : scale)}
                >
                  {scale}
                </span>
              ))}
            </div>
            
            {selectedScale && scaleAbcString && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <NotationPlayer visualAbc={scaleAbcString} audioAbc={scaleAbcString} lang={lang} playAccompaniment={false} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
