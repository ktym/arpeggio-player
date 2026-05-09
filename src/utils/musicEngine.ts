import { Chord, Note, Scale, Interval } from "@tonaljs/tonal";

export type Instrument = "C" | "Bb" | "Eb";
export type ArpeggioDirection = "up" | "down" | "random";

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
  if (oct === 4) {
    abcNote = letter;
  } else if (oct === 5) {
    abcNote = letter.toLowerCase();
  } else if (oct > 5) {
    abcNote = letter.toLowerCase() + "'".repeat(oct - 5);
  } else if (oct < 4) {
    abcNote = letter + ",".repeat(4 - oct);
  }

  return `${abcAcc}${abcNote}`;
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
  visualOctaveOffset: number
): string {
  if (progression.length === 0) return "";

  // Base rhythm length determines the default note duration
  // e.g. 16 chars = L:1/16, 8 chars = L:1/8, 4 chars = L:1/4
  const numNotesPerMeasure = rhythmPattern.length;
  // Fallback to 4 if empty
  const beatDivisions = numNotesPerMeasure || 4; 
  let L = "1/4";
  if (beatDivisions === 8) L = "1/8";
  if (beatDivisions === 16) L = "1/16";
  if (beatDivisions === 12) L = "1/8"; // roughly triplets (or compound)

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
  
  abc += `%%MIDI program ${playbackProgram}\n`;
  abc += `M: 4/4\n`;
  abc += `L: ${L}\n`;
  abc += `K: C\n`;

  // Determine key signature string if we wanted, but we'll use accidentals.

  let prevNote: string | null = null;
  const baseOctave = getBaseOctave(playbackProgram);

  for (let i = 0; i < progression.length; i++) {
    const measure = progression[i];
    if (measure.chords.length === 0) continue;

    // Distribute the rhythm characters over the chords in the measure
    // For example, if rhythm is 16 chars and 2 chords, each gets 8 chars.
    const charsPerChord = Math.max(1, Math.floor(beatDivisions / measure.chords.length));
    
    let measureAbc = "";
    
    measure.chords.forEach((chordStr, chordIndex) => {
      // Reset prevNote for each chord to avoid climbing indefinitely out of instrument range
      prevNote = null;
      
      const chord = Chord.get(chordStr);
      // Fallback notes if invalid chord
      let notes = chord.empty ? ["C", "E", "G"] : chord.notes;

      // Ensure we have notes to play
      if (notes.length === 0) notes = ["C"];

      // Add a chord symbol to the first note of this chord's sequence
      let isFirstNoteOfChord = true;

      // Extract the specific rhythm slice for this chord
      const rhythmSlice = rhythmPattern.substring(
        chordIndex * charsPerChord, 
        (chordIndex + 1) * charsPerChord
      );

      let noteIdx = 0;
      // Pre-generate exactly 2 octaves of notes to keep it within a strict musical bound.
      let notesPool: string[] = [];
      const rootStr = notes[0];
      let currentOctave = baseOctave;
      let prevMidi = Note.midi(`${rootStr}${currentOctave}`) || 0;

      // Construct first octave ascending
      notes.forEach((n) => {
        let midi = Note.midi(`${n}${currentOctave}`) || 0;
        if (midi < prevMidi) {
          currentOctave++;
          midi = Note.midi(`${n}${currentOctave}`) || 0;
        }
        notesPool.push(`${n}${currentOctave}`);
        prevMidi = midi;
      });

      // Construct second octave ascending
      notes.forEach((n) => {
        let midi = Note.midi(`${n}${currentOctave}`) || 0;
        if (midi < prevMidi) {
          currentOctave++;
          midi = Note.midi(`${n}${currentOctave}`) || 0;
        }
        notesPool.push(`${n}${currentOctave}`);
        prevMidi = midi;
      });
      
      // Shuffle if random
      if (direction === 'random') {
        notesPool = notesPool.sort(() => Math.random() - 0.5);
      } else if (direction === 'down') {
        notesPool = notesPool.reverse();
      }

      for (let j = 0; j < rhythmSlice.length; j++) {
        const char = rhythmSlice[j];
        if (char.toLowerCase() === 'x') {
          // Cycle through the strictly bounded 2-octave pool
          let targetNote = notesPool[noteIdx % notesPool.length];
          noteIdx++;
          
          // Transpose targetNote if needed
          if (instrument !== "C") {
            const transposed = Note.transpose(targetNote, TRANSPOSE_MAP[instrument]);
            if (transposed) {
              targetNote = transposed;
            }
          }
          if (visualOctaveOffset !== 0) {
            const nInfo = Note.get(targetNote);
            targetNote = `${nInfo.letter}${nInfo.acc}${nInfo.oct! + visualOctaveOffset}`;
          }

          const abcNote = toABCFormat(targetNote);
          
          if (isFirstNoteOfChord) {
            measureAbc += `"${chordStr}"${abcNote} `;
            isFirstNoteOfChord = false;
          } else {
            measureAbc += `${abcNote} `;
          }
        } else {
          // Rest or Tie. For simplicity, we make it a rest 'z'
          measureAbc += `z `;
        }
      }
    });

    abc += measureAbc.trim() + " | ";
    
    // Newline every 4 measures
    if ((i + 1) % 4 === 0) {
      abc += "\n";
    }
  }

  return abc;
}
