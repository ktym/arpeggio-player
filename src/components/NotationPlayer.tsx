import React, { useEffect, useRef, useState } from 'react';
import abcjs from 'abcjs';
import { Settings2 } from 'lucide-react';
import 'abcjs/abcjs-audio.css';

interface NotationPlayerProps {
  abcString: string;
  lang: 'en' | 'ja';
  playAccompaniment?: boolean;
}

export const NotationPlayer: React.FC<NotationPlayerProps> = ({ abcString, lang, playAccompaniment = false }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const synthControllerRef = useRef<any>(null);
  const [tempo, setTempo] = useState(120);
  const [error, setError] = useState<string | null>(null);

  const uniqueId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const paperId = `paper-${uniqueId}`;
  const audioId = `audio-controls-${uniqueId}`;

  const [debouncedAbc, setDebouncedAbc] = useState(abcString);

  // Debounce the abcString to prevent synth racing during fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAbc(abcString);
    }, 300);
    return () => clearTimeout(timer);
  }, [abcString]);

  useEffect(() => {
    if (!paperRef.current) return;
    let isActive = true;
    
    try {
      setError(null);
      
      // Add tempo to abcString if not present
      const abcWithTempo = debouncedAbc.includes('Q:') 
        ? debouncedAbc 
        : debouncedAbc.replace('K: C\n', `K: C\nQ: 1/4=${tempo}\n`);

      const visualObj = abcjs.renderAbc(paperRef.current, abcWithTempo, {
        add_classes: true,
        responsive: 'resize'
      })[0]; // get the first tune

      // Completely reset audio controls DOM
      const audioControls = document.getElementById(audioId);
      if (audioControls) {
        audioControls.innerHTML = '';
      }

      // Recreate the synth controller from scratch
      const synthControl = new abcjs.synth.SynthController();
      synthControllerRef.current = synthControl;
      
      synthControl.load(`#${audioId}`, null, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: false
      });

      const createSynth = new abcjs.synth.CreateSynth();
      createSynth.init({
        visualObj: visualObj,
        options: {
          soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/",
          chordsOff: true
        }
      }).then(() => {
        if (!isActive) return;
        synthControl.setTune(visualObj, false, {
          soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/",
          chordsOff: true
        }).catch((err: any) => {
          console.warn("Audio warning:", err);
        });
      }).catch((err: any) => {
        if (!isActive) return;
        console.error("Synth init error:", err);
      });

    } catch (err: any) {
      if (!isActive) return;
      setError(err.message || "Failed to render notation.");
    }
    
    return () => {
      isActive = false;
      if (synthControllerRef.current) {
        try {
          synthControllerRef.current.pause();
          synthControllerRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [debouncedAbc, tempo, audioId, playAccompaniment]);

  return (
    <div className="panel">
      <h2><Settings2 size={20} /> {lang === 'ja' ? '楽譜と再生' : 'Sheet Music & Playback'}</h2>
      
      {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
      
      <div className="notation-container">
        <div ref={paperRef} id={paperId}></div>
      </div>

      <div className="playback-controls" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div className="flex-row" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <label>{lang === 'ja' ? `テンポ (BPM): ${tempo}` : `Tempo (BPM): ${tempo}`}</label>
            <input 
              type="range" 
              min="40" 
              max="240" 
              value={tempo} 
              onChange={(e) => setTempo(Number(e.target.value))}
            />
          </div>
        </div>
        
        {/* Hidden but used by abcjs for its default audio controls */}
        <div id={audioId} style={{ width: '100%', marginTop: '1rem' }}></div>
      </div>
    </div>
  );
};
