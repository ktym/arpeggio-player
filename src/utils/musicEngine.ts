import { Chord, Note, Scale } from "@tonaljs/tonal";

export type Instrument = "C" | "Bb" | "Eb";
export type ArpeggioDirection = "up" | "down" | "random" | "root" | "root3";

const TRANSPOSE_MAP: Record<Instrument, string> = {
  "C": "1P",
  "Bb": "2M", // Tenor/Soprano sax (reads D to sound C)
  "Eb": "6M"  // Alto/Bari sax (reads A to sound C)
};

export interface MeasureData {
  chords: string[];
}

// Helper to determine the default base octave based on instrument
export function getBaseOctave(playbackProgram: number): number {
  // Tenor Sax (66) and Baritone Sax (67) naturally play lower
  if (playbackProgram === 66 || playbackProgram === 67) {
    return 3;
  }
  return 4; // Piano, Soprano, Alto
}

export function parseChordProgression(input: string): MeasureData[] {
  return input
    .split(/[|\n]/)
    .map(measureStr => measureStr.trim())
    .filter(measureStr => measureStr.length > 0)
    .map(measureStr => {
      return {
        chords: measureStr.split(/\s+/).filter(Boolean)
      };
    });
}

// Extracts scales from a chord progression for display
export function analyzeScales(progression: MeasureData[]): string[] {
  const uniqueChords = new Set<string>();
  progression.forEach(m => m.chords.forEach(c => uniqueChords.add(c)));
  
  // Basic heuristic: check if major/minor
  const scales: string[] = [];
  uniqueChords.forEach(chordStr => {
    const chord = Chord.get(chordStr);
    if (chord.empty) return;
    
    // Suggest a basic scale based on chord quality
    if (chord.quality === "Major") {
      scales.push(`${chord.tonic} Major`);
    } else if (chord.quality === "Minor") {
      scales.push(`${chord.tonic} Dorian`);
    } else if (chord.aliases.includes("7") || chord.aliases.includes("dom")) {
      scales.push(`${chord.tonic} Mixolydian`);
    }
  });
  
  return Array.from(new Set(scales));
}

// Converts a scientific pitch note (e.g., C4, Eb5) to ABC notation (e.g., C, _e)
function toABCFormat(noteInfo: string): string {
  const n = Note.get(noteInfo);
  if (n.empty) return "";

  const letter = n.letter;
  const acc = n.acc;
  const oct = n.oct;

  let abcAcc = "";
  if (acc === "b") abcAcc = "_";
  else if (acc === "bb") abcAcc = "__";
  else if (acc === "#") abcAcc = "^";
  else if (acc === "##") abcAcc = "^^";

  // ABC octaves: 
  // C4 = C (middle C)
  // C5 = c
  // C3 = C,
  // C6 = c'
  let abcNote = letter;
  if (oct !== undefined) {
    if (oct === 4) {
      abcNote = letter;
    } else if (oct === 5) {
      abcNote = letter.toLowerCase();
    } else if (oct > 5) {
      abcNote = letter.toLowerCase() + "'".repeat(oct - 5);
    } else if (oct < 4) {
      abcNote = letter + ",".repeat(4 - oct);
    }
  }

  return `${abcAcc}${abcNote}`;
}

export interface RhythmEvent {
  isNote: boolean;
  isTriplet: boolean;
  abcDuration: number;
  strDuration: string;
}

export function parseRhythmPattern(patternStr: string): RhythmEvent[][] {
  const isSimpleSyntax = /^[xXzZ\- \n|]+$/.test(patternStr);
  
  const measures = patternStr.split('|').map(s => s.trim()).filter(s => s.length > 0);
  
  if (isSimpleSyntax) {
    return measures.map(measureStr => {
      const chars = measureStr.replace(/\s+/g, '');
      const len = chars.length;
      const events: RhythmEvent[] = [];
      
      let baseAbcDuration = 1;
      let isTriplet = false;
      
      if (len <= 4) {
        baseAbcDuration = 4; // 4分音符
      } else if (len <= 8) {
        baseAbcDuration = 2; // 8分音符
      } else if (len === 12) {
        baseAbcDuration = 2; // 8分3連符
        isTriplet = true;
      } else {
        baseAbcDuration = 1; // 16分音符
      }

      let actualDuration = baseAbcDuration;
      if (isTriplet) {
        actualDuration = baseAbcDuration * (2 / 3);
      }

      for (const char of chars) {
        if (char.toLowerCase() === 'x') {
          events.push({ isNote: true, isTriplet, abcDuration: actualDuration, strDuration: baseAbcDuration.toString() });
        } else {
          events.push({ isNote: false, isTriplet, abcDuration: actualDuration, strDuration: baseAbcDuration.toString() });
        }
      }
      return events;
    });
  }

  return measures.map(measureStr => {
    const tokens = measureStr.split(/\s+/).filter(Boolean);
    return tokens.map(token => {
      let isNote = true;
      let s = token.toLowerCase();
      if (s.startsWith('r')) {
        isNote = false;
        s = s.substring(1);
      } else if (s.endsWith('r')) {
        isNote = false;
        s = s.substring(0, s.length - 1);
      }

      let isTriplet = false;
      if (s.endsWith('t')) {
        isTriplet = true;
        s = s.substring(0, s.length - 1);
      }

      let isDotted = false;
      if (s.endsWith('.')) {
        isDotted = true;
        s = s.substring(0, s.length - 1);
      }

      const val = parseInt(s, 10) || 4;
      let abcDuration = 16 / val;
      if (isDotted) abcDuration *= 1.5;
      
      let strDuration = abcDuration.toString();
      let actualDuration = abcDuration;
      if (isTriplet) {
        actualDuration = abcDuration * (2 / 3);
      }

      return {
        isNote,
        isTriplet,
        abcDuration: actualDuration,
        strDuration: strDuration
      };
    });
  });
}

function buildNotesPool(chordStr: string, baseOctave: number, direction: ArpeggioDirection, seed: number = 0): string[] {
  const chord = Chord.get(chordStr);
  let notes = chord.empty ? ["C", "E", "G"] : chord.notes;
  if (notes.length === 0) notes = ["C"];

  let s = seed + 12345;
  const random = () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };

  if (direction === "root") {
    return [`${notes[0]}${baseOctave}`];
  }

  if (direction === "root3") {
    const rootNote = `${notes[0]}${baseOctave}`;
    let thirdNote = rootNote;
    if (notes.length > 1) {
      let thirdOctave = baseOctave;
      if ((Note.midi(`${notes[1]}${thirdOctave}`) || 0) < (Note.midi(rootNote) || 0)) {
         thirdOctave++;
      }
      thirdNote = `${notes[1]}${thirdOctave}`;
    }
    
    // Create a pool of 16 notes to ensure a good random distribution
    const pool: string[] = [];
    for (let i = 0; i < 16; i++) {
      // 50% chance for a 3rd note to act as a random ornament
      pool.push(random() < 0.5 ? thirdNote : rootNote);
    }
    // Ensure the very first note of the chord is ALWAYS the Root note
    pool[0] = rootNote;
    return pool;
  }

  let notesPool: string[] = [];
  const rootStr = notes[0];
  let currentOctave = baseOctave;
  let prevMidi = Note.midi(`${rootStr}${currentOctave}`) || 0;

  notes.forEach((n) => {
    let midi = Note.midi(`${n}${currentOctave}`) || 0;
    if (midi < prevMidi) {
      currentOctave++;
      midi = Note.midi(`${n}${currentOctave}`) || 0;
    }
    notesPool.push(`${n}${currentOctave}`);
    prevMidi = midi;
  });

  notes.forEach((n) => {
    let midi = Note.midi(`${n}${currentOctave}`) || 0;
    if (midi < prevMidi) {
      currentOctave++;
      midi = Note.midi(`${n}${currentOctave}`) || 0;
    }
    notesPool.push(`${n}${currentOctave}`);
    prevMidi = midi;
  });
  
  if (direction === 'random') {
    notesPool = notesPool.sort(() => random() - 0.5);
  } else if (direction === 'down') {
    notesPool = notesPool.reverse();
  }
  
  return notesPool;
}

export function generateScaleABC(scaleName: string, instrument: Instrument, playbackProgram: number, visualOctaveOffset: number): string {
  const scale = Scale.get(scaleName.toLowerCase());
  if (scale.empty) return "";

  const baseOctave = getBaseOctave(playbackProgram);
  
  // Use Note.transpose to maintain correct enharmonic spelling
  const notesWithOctave = scale.intervals.map(interval => {
     return Note.transpose(`${scale.tonic}${baseOctave}`, interval);
  });
  // Add the top root note
  notesWithOctave.push(Note.transpose(`${scale.tonic}${baseOctave}`, "8P"));

  let abc = `X: 2\n`;
  abc += `T: ${scaleName} Scale\n`;
  
  let midiTranspose = 0;
  if (instrument === "Bb") {
    abc += `T: Transposed for B♭ Instruments\n`;
    midiTranspose = -2;
  } else if (instrument === "Eb") {
    abc += `T: Transposed for E♭ Instruments\n`;
    midiTranspose = -9;
  }
  
  midiTranspose -= (visualOctaveOffset * 12);
  
  if (midiTranspose !== 0) {
    abc += `%%MIDI transpose ${midiTranspose}\n`;
  }
  
  abc += `%%MIDI program ${playbackProgram}\n`;
  abc += `M: 4/4\n`;
  abc += `L: 1/4\n`;
  abc += `K: C\n`;

  let measureAbc = "";
  notesWithOctave.forEach((note) => {
    let targetNote = note!;
    if (instrument !== "C") {
      const transposed = Note.transpose(targetNote, TRANSPOSE_MAP[instrument]);
      if (transposed) targetNote = transposed;
    }
    if (visualOctaveOffset !== 0) {
      const nInfo = Note.get(targetNote);
      targetNote = `${nInfo.letter}${nInfo.acc}${nInfo.oct! + visualOctaveOffset}`;
    }
    measureAbc += `${toABCFormat(targetNote)} `;
  });

  abc += measureAbc.trim() + " |]\n";
  return abc;
}

export function generateABC(
  progression: MeasureData[],
  rhythmPattern: string,
  instrument: Instrument,
  direction: ArpeggioDirection,
  title: string,
  playbackProgram: number,
  visualOctaveOffset: number,
  playAccompaniment: boolean = true,
  globalSeed: number = 0
): string {
  if (progression.length === 0) return "";

  const parsedRhythms = parseRhythmPattern(rhythmPattern);
  if (parsedRhythms.length === 0) {
     parsedRhythms.push([{ isNote: true, isTriplet: false, abcDuration: 4, strDuration: "4" }]);
  }

  // Standard ABC header
  let abc = `X: 1\n`;
  abc += `T: ${title || 'Arpeggio Practice'}\n`;
  
  let midiTranspose = 0;
  if (instrument === "Bb") {
    abc += `T: Transposed for B♭ Instruments\n`;
    midiTranspose = -2;
  } else if (instrument === "Eb") {
    abc += `T: Transposed for E♭ Instruments\n`;
    midiTranspose = -9;
  }
  
  midiTranspose -= (visualOctaveOffset * 12);
  
  if (midiTranspose !== 0) {
    abc += `%%MIDI transpose ${midiTranspose}\n`;
  }
  
  if (playAccompaniment) {
    abc += `%%score (1 2)\n`;
  }
  
  abc += `M: 4/4\n`;
  abc += `L: 1/16\n`;
  abc += `K: C\n`;

  // Determine key signature string if we wanted, but we'll use accidentals.

  const baseOctave = getBaseOctave(playbackProgram);

  let v1CurrentLine = "";
  let v2CurrentLine = "";

  for (let i = 0; i < progression.length; i++) {
    const measure = progression[i];
    if (measure.chords.length === 0) continue;

    const currentRhythmMeasure = parsedRhythms[i % parsedRhythms.length];
    const numOriginalChords = measure.chords.length;
    const voice2UnitsPerChord = Math.max(1, Math.floor(16 / numOriginalChords));
    
    let measureAbc = "";
    let measureVoice2 = "";

    const chordSpans: { chordStr: string, slots: number }[] = [];
    measure.chords.forEach(c => {
      if (chordSpans.length > 0 && chordSpans[chordSpans.length - 1].chordStr === c) {
        chordSpans[chordSpans.length - 1].slots += 1;
      } else {
        chordSpans.push({ chordStr: c, slots: 1 });
      }
    });
    
    const chordTimeline: { start: number, end: number, chordStr: string }[] = [];
    let tCursor = 0;

    chordSpans.forEach((span) => {
      const chordStr = span.chordStr;
      const chord = Chord.get(chordStr);
      let notes = chord.empty ? ["C", "E", "G"] : chord.notes;
      if (notes.length === 0) notes = ["C"];

      // --- Voice 2: Sustained Chords (1 octave higher) ---
      let chordOctave = baseOctave + 1;
      let chordNotesStr = "";
      let prevMidiChord = Note.midi(`${notes[0]}${chordOctave}`) || 0;
      let currentOctaveChord = chordOctave;

      notes.forEach((n, idx) => {
        let midi = Note.midi(`${n}${currentOctaveChord}`) || 0;
        if (idx > 0 && midi < prevMidiChord) {
          currentOctaveChord++;
          midi = Note.midi(`${n}${currentOctaveChord}`) || 0;
        }
        prevMidiChord = midi;

        let targetNote = `${n}${currentOctaveChord}`;

        if (instrument !== "C") {
          const transposed = Note.transpose(targetNote, TRANSPOSE_MAP[instrument]);
          if (transposed) targetNote = transposed;
        }
        if (visualOctaveOffset !== 0) {
          const nInfo = Note.get(targetNote);
          targetNote = `${nInfo.letter}${nInfo.acc}${nInfo.oct! + visualOctaveOffset}`;
        }
        chordNotesStr += toABCFormat(targetNote);
      });

      const chordDurationUnits = span.slots * voice2UnitsPerChord;
      measureVoice2 += `[${chordNotesStr}]${chordDurationUnits} `;
      
      chordTimeline.push({ start: tCursor, end: tCursor + chordDurationUnits, chordStr: span.chordStr });
      tCursor += chordDurationUnits;
    });

    // --- Voice 1: Arpeggio Melody ---
    let t = 0;
    let eventIdx = 0;
    let prevT = -1;
    let tripletCount = 0;
    let chordChangeCount = 0;
    
    let activeChordStr = "";
    let currentNoteIdx = 0;
    let notesPool: string[] = [];

    while (t < 16) {
      const event = currentRhythmMeasure[eventIdx % currentRhythmMeasure.length];
      if (event.abcDuration <= 0) break;

      const activeSpan = chordTimeline.find(span => t >= span.start && t < span.end) || chordTimeline[chordTimeline.length - 1];
      
      if (activeSpan.chordStr !== activeChordStr) {
        activeChordStr = activeSpan.chordStr;
        currentNoteIdx = 0;
        chordChangeCount++;
        notesPool = buildNotesPool(activeChordStr, baseOctave, direction, globalSeed + i * 1000 + chordChangeCount);
      }

      let prefix = "";
      if (event.isTriplet) {
        if (tripletCount === 0) prefix = "(3";
        tripletCount = (tripletCount + 1) % 3;
      } else {
        tripletCount = 0;
      }
      
      let chordLabel = "";
      if (t === activeSpan.start || (t > activeSpan.start && prevT < activeSpan.start)) {
        chordLabel = `"${activeChordStr}"`;
      }

      if (event.isNote) {
        let targetNote = notesPool[currentNoteIdx % notesPool.length];
        currentNoteIdx++;
        
        if (instrument !== "C") {
          const transposed = Note.transpose(targetNote, TRANSPOSE_MAP[instrument]);
          if (transposed) targetNote = transposed;
        }
        if (visualOctaveOffset !== 0) {
          const nInfo = Note.get(targetNote);
          targetNote = `${nInfo.letter}${nInfo.acc}${nInfo.oct! + visualOctaveOffset}`;
        }

        let abcNote = toABCFormat(targetNote);
        measureAbc += `${chordLabel}${prefix}${abcNote}${event.strDuration} `;
      } else {
        measureAbc += `${chordLabel}${prefix}z${event.strDuration} `;
      }
      
      prevT = t;
      t += event.abcDuration;
      eventIdx++;
    }

    v1CurrentLine += measureAbc.trim() + " | ";
    v2CurrentLine += measureVoice2.trim() + " | ";
    
    // Newline every 4 measures
    if ((i + 1) % 4 === 0 || i === progression.length - 1) {
      abc += `V: 1\n%%MIDI program ${playbackProgram}\n${v1CurrentLine}\n`;
      if (playAccompaniment) {
        abc += `V: 2\n%%MIDI program 16\n%%MIDI control 7 60\n${v2CurrentLine}\n`;
      }
      v1CurrentLine = "";
      v2CurrentLine = "";
    }
  }

  return abc;
}
