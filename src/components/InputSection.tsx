import React, { useState } from 'react';
import type { Instrument, ArpeggioDirection } from '../utils/musicEngine';
import { HelpCircle, Music, RefreshCw } from 'lucide-react';

interface InputSectionProps {
  lang: 'en' | 'ja';
  chordsInput: string;
  setChordsInput: (val: string) => void;
  rhythmPattern: string;
  setRhythmPattern: (val: string) => void;
  instrument: Instrument;
  setInstrument: (val: Instrument) => void;
  direction: ArpeggioDirection;
  setDirection: (val: ArpeggioDirection) => void;
  title: string;
  setTitle: (val: string) => void;
  playbackProgram: number;
  setPlaybackProgram: (val: number) => void;
  visualOctaveOffset: number;
  setVisualOctaveOffset: (val: number) => void;
  playAccompaniment: boolean;
  setPlayAccompaniment: (val: boolean) => void;
  onShuffle?: () => void;
}

const PRESETS = [
  { 
    name: "ii-V-I (C)", 
    chords: "Dm7 G7 | Cmaj7",
    rhythm: "x-xx-x-x-x-xx-x-"
  },
  { 
    name: "Jazz Blues (F)", 
    chords: "F7 | Bb7 | F7 | Cm7 F7\nBb7 | Bdim7 | F7 | Am7 D7\nGm7 | C7 | F7 D7 | Gm7 C7",
    rhythm: "8 8 8 8 8 8 8 8"
  },
  { 
    name: "Rhythm Changes (Bb)", 
    chords: "Bbmaj7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7\nFm7 Bb7 | Ebmaj7 Ab7 | Dm7 G7 | Cm7 F7",
    rhythm: "8t 8t 8t 8t 8t 8t 8t 8t 8t 8t 8t 8t"
  },
  {
    name: "Autumn Leaves (Gm)",
    chords: "Cm7 | F7 | BbM7 | EbM7\nAm7b5 | D7 | Gm7 | Gm7",
    rhythm: "r8 8 r8 8 4 4 | 4 8 8 r2"
  }
];

export const InputSection: React.FC<InputSectionProps> = ({
  lang,
  chordsInput,
  setChordsInput,
  rhythmPattern,
  setRhythmPattern,
  instrument,
  setInstrument,
  direction,
  setDirection,
  title,
  setTitle,
  playbackProgram,
  setPlaybackProgram,
  visualOctaveOffset,
  setVisualOctaveOffset,
  playAccompaniment,
  setPlayAccompaniment,
  onShuffle
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><Music size={20} /> {lang === 'ja' ? 'コード進行' : 'Chord Progression'}</h2>
        <button onClick={() => setShowHelp(!showHelp)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)' }}>
          <HelpCircle size={20} /> {lang === 'ja' ? 'ヘルプ' : 'Help'}
        </button>
      </div>

      {showHelp && (
        <div className="help-box" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {lang === 'ja' ? (
            <>
              <strong>【コード進行の入力方法】</strong>
              <ul style={{ marginBottom: '1rem' }}>
                <li>小節の区切りには <code>|</code>（パイプ）または改行を使います。</li>
                <li>1小節内のコードは半角スペースで区切ります。</li>
                <li>例: <code>Cmaj7 | Dm7 G7 | Cmaj7</code></li>
                <li><code>Gm Cm7 | F F Bb F/A</code> のように小節内に同じコードを連続して書いた場合（この例の2小節目の最初の <code>F</code> 2つ）、音が途切れることなく1つの繋がった長いコードとして演奏・描画されます。</li>
              </ul>

              <strong>【対応しているコード表記（Aをルートとする例）】</strong>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>※同じ行の表記はすべて同じコードとして認識されます。</p>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <li><strong>メジャー:</strong> A, Amaj, AM</li>
                <li><strong>マイナー:</strong> Am, Amin, A-</li>
                <li><strong>セブンス:</strong> A7, Adom7</li>
                <li><strong>メジャーセブンス:</strong> Amaj7, AM7, Ama7, A^7</li>
                <li><strong>マイナーセブンス:</strong> Am7, Amin7, A-7</li>
                <li><strong>マイナーメジャー7:</strong> AmM7, Am(maj7)</li>
                <li><strong>ディミニッシュ:</strong> Adim, A°</li>
                <li><strong>ディミニッシュ7:</strong> Adim7, A°7</li>
                <li><strong>ハーフディミニッシュ:</strong> Am7b5, Aø</li>
                <li><strong>オーギュメント:</strong> Aaug, A+</li>
                <li><strong>サスフォー:</strong> Asus4, Asus</li>
                <li><strong>シックス:</strong> A6, Am6</li>
                <li><strong>テンション/アド:</strong> Aadd9, A9, A13</li>
                <li><strong>オルタード:</strong> A7#9, A7b13, Aalt</li>
              </ul>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <strong>分数コード（オンコード）について:</strong><br/>
                "Am7 on G" ではなく、スラッシュを使って <code>Am7/G</code> のように入力してください。
              </p>

              <strong>【リズムパターンの指定方法】</strong>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <li><strong>★シンプルバージョン（全ての音符を同じ長さで刻む）</strong></li>
                <li>文字の長さで1小節あたりの音符の長さが決まります。<code>x</code> で音が鳴り、<code>-</code> で休符になります。</li>
                <li>例: <code>x-xx-x-x | -x-xx-x-</code> （1小節が8文字なので1文字が8分音符になり、2小節パターンになります）</li>
                <li style={{ marginTop: '0.5rem' }}><strong>★アドバンスドバージョン（様々な長さの音符を組み合わせる）</strong></li>
                <li>数字をスペース区切りで並べます。<code>|</code> で区切ると「複数小節の繰り返しパターン」を作れます。</li>
                <li><strong>音符:</strong> <code>4</code> (4分音符), <code>8</code> (8分音符), <code>16</code> (16分音符), <code>2</code> (2分音符), <code>1</code> (全音符)</li>
                <li><strong>休符:</strong> 数字の前に <code>r</code> を付けます（例: <code>r4</code> = 4分休符, <code>r8</code> = 8分休符）</li>
                <li><strong>付点と3連符:</strong> <code>4.</code> (付点4分), <code>8t</code> (8分3連符の1つ分)</li>
                <li>例: <code>r8 8 r8 8 4 4 | 4 8 8 r2</code> （1小節目は裏拍から入るリズム、2小節目は4分・8分×2・2分休符）</li>
              </ul>

              <strong>【プリセット進行について】</strong>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <li><strong>ii-V-I:</strong> ジャズやポピュラー音楽で最も基本的かつ重要な「ツー・ファイブ・ワン」進行。</li>
                <li><strong>Jazz Blues:</strong> 伝統的な12小節のブルースを、ジャズ向けに複雑なコード（セブンスやツーファイブ）でアレンジしたもの。</li>
                <li><strong>Rhythm Changes:</strong> G.ガーシュウィンの名曲「I Got Rhythm」のコード進行。ジャズのセッションで極めて頻繁に演奏される定番曲の骨格です。</li>
                <li><strong>Autumn Leaves:</strong> ジャズ・スタンダードの代表曲「枯葉」の進行。マイナー・ツーファイブを含む美しい哀愁のある進行で、アルペジオ練習にも最適です。</li>
              </ul>

              <strong>【使用可能なスケールの見方】</strong>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                入力されたコード進行をもとに、そのコード上でアドリブ演奏や練習をする際に使える代表的なスケール（音階）を提案しています。
                例えば「C Major」ならドレミファソラシド、「D Dorian」ならレミファソラシドレのように、そのコードの響きに合った音使いの目安として活用してください。
              </p>
            </>
          ) : (
            <>
              <strong>How to enter chords:</strong>
              <ul style={{ marginBottom: '1rem' }}>
                <li>Separate measures using a pipe <code>|</code> or a newline.</li>
                <li>Separate chords within a measure using spaces.</li>
                <li>Example: <code>Cmaj7 | Dm7 G7 | Cmaj7</code></li>
                <li>If you write consecutive identical chords like <code>Gm Cm7 | F F Bb F/A</code>, the two <code>F</code> chords will be seamlessly combined into one continuous chord block.</li>
              </ul>

              <strong>Supported Chord Formats (using A as root):</strong>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Note: Formats on the same line are equivalent.</p>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <li><strong>Major:</strong> A, Amaj, AM</li>
                <li><strong>Minor:</strong> Am, Amin, A-</li>
                <li><strong>Dominant 7th:</strong> A7, Adom7</li>
                <li><strong>Major 7th:</strong> Amaj7, AM7, Ama7, A^7</li>
                <li><strong>Minor 7th:</strong> Am7, Amin7, A-7</li>
                <li><strong>Minor Major 7th:</strong> AmM7, Am(maj7)</li>
                <li><strong>Diminished:</strong> Adim, A°</li>
                <li><strong>Diminished 7th:</strong> Adim7, A°7</li>
                <li><strong>Half-Dim:</strong> Am7b5, Aø</li>
                <li><strong>Augmented:</strong> Aaug, A+</li>
                <li><strong>Suspended:</strong> Asus4, Asus</li>
                <li><strong>6th:</strong> A6, Am6</li>
                <li><strong>Extensions:</strong> Aadd9, A9, A13</li>
                <li><strong>Altered:</strong> A7#9, A7b13, Aalt</li>
              </ul>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <strong>Slash Chords:</strong><br/>
                Use a slash <code>Am7/G</code> instead of "on" (like "Am7 on G").
              </p>

              <strong>Rhythm Pattern Syntax:</strong>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <li><strong>★ Simple Version (Fixed length grid)</strong></li>
                <li>String length sets note duration. <code>x</code> plays a note, <code>-</code> is a rest.</li>
                <li>Example: <code>x-xx-x-x | -x-xx-x-</code> (8 chars per measure means 8th notes, spanning 2 measures)</li>
                <li style={{ marginTop: '0.5rem' }}><strong>★ Advanced Version (Mixed durations)</strong></li>
                <li>Enter note durations separated by spaces. Use <code>|</code> for multi-measure patterns.</li>
                <li><strong>Notes:</strong> <code>4</code> (Quarter), <code>8</code> (Eighth), <code>16</code> (16th), <code>2</code> (Half), <code>1</code> (Whole)</li>
                <li><strong>Rests:</strong> Add <code>r</code> before the number (e.g., <code>r4</code>, <code>r8</code>)</li>
                <li><strong>Dots & Triplets:</strong> <code>4.</code> (Dotted quarter), <code>8t</code> (Eighth triplet)</li>
                <li>Example: <code>r8 8 r8 8 4 4 | 4 8 8 r2</code></li>
              </ul>

              <strong>Preset Progressions:</strong>
              <ul style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <li><strong>ii-V-I:</strong> The most common and fundamental chord progression in jazz and popular music.</li>
                <li><strong>Jazz Blues:</strong> A traditional 12-bar blues reharmonized with typical jazz chords (extended sevenths and ii-V progressions).</li>
                <li><strong>Rhythm Changes:</strong> The chord progression from George Gershwin's "I Got Rhythm", a staple standard played at almost every jazz jam session.</li>
                <li><strong>Autumn Leaves:</strong> A quintessential jazz standard. Its descending fourths progression and minor ii-V-i cadences make it an essential practice piece.</li>
              </ul>

              <strong>Suggested Scales:</strong>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Based on your chord progression, the engine suggests typical musical scales suitable for improvisation or practice over those chords. 
                For example, "C Major" (C D E F G A B) or "D Dorian" (D E F G A B C) provide a safe and melodic set of notes that fit the underlying harmony. Use them as a guide for your practice.
              </p>
            </>
          )}
        </div>
      )}

      <div className="preset-list" style={{ marginTop: '1rem' }}>
        {PRESETS.map((preset, idx) => (
          <button 
            key={idx} 
            onClick={() => {
              setChordsInput(preset.chords);
              setRhythmPattern(preset.rhythm);
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="flex-col">
        <textarea 
          value={chordsInput}
          onChange={(e) => setChordsInput(e.target.value)}
          placeholder={lang === 'ja' ? "例: Cmaj7 | Dm7 G7 | Cmaj7" : "e.g. Cmaj7 | Dm7 G7 | Cmaj7"}
        />

        <div className="grid-2">
          <div>
            <label>{lang === 'ja' ? '楽譜（移調）' : 'Sheet Music (Transposition)'}</label>
            <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
              <option value="C">{lang === 'ja' ? '実音 (コンサートピッチ C)' : 'Concert Pitch (C)'}</option>
              <option value="Eb">{lang === 'ja' ? 'E♭管 (アルト/バリトン)' : 'E♭ Instruments (Alto/Bari Sax)'}</option>
              <option value="Bb">{lang === 'ja' ? 'B♭管 (テナー/ソプラノ)' : 'B♭ Instruments (Tenor/Soprano Sax)'}</option>
            </select>
          </div>
          <div>
            <label>{lang === 'ja' ? '再生音色' : 'Playback Sound'}</label>
            <select value={playbackProgram} onChange={(e) => setPlaybackProgram(Number(e.target.value))}>
              <option value={0}>{lang === 'ja' ? 'ピアノ' : 'Piano'}</option>
              <option value={64}>{lang === 'ja' ? 'ソプラノサックス' : 'Soprano Sax'}</option>
              <option value={65}>{lang === 'ja' ? 'アルトサックス' : 'Alto Sax'}</option>
              <option value={66}>{lang === 'ja' ? 'テナーサックス' : 'Tenor Sax'}</option>
              <option value={67}>{lang === 'ja' ? 'バリトンサックス' : 'Baritone Sax'}</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', height: '100%', marginBottom: 0 }}>
              <input 
                type="checkbox" 
                checked={playAccompaniment} 
                onChange={(e) => setPlayAccompaniment(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', margin: 0 }}
              />
              {lang === 'ja' ? '伴奏（コード）をオルガンで鳴らす' : 'Play Organ Chord Accompaniment'}
            </label>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label>{lang === 'ja' ? '楽譜のオクターブ調整' : 'Notation Octave Shift'}</label>
            <select value={visualOctaveOffset} onChange={(e) => setVisualOctaveOffset(Number(e.target.value))}>
              <option value={1}>{lang === 'ja' ? '+1 オクターブ (高く表記)' : '+1 Octave (Written Higher)'}</option>
              <option value={0}>{lang === 'ja' ? 'デフォルト' : 'Default'}</option>
              <option value={-1}>{lang === 'ja' ? '-1 オクターブ (低く表記)' : '-1 Octave (Written Lower)'}</option>
            </select>
          </div>
          <div>
            <label>{lang === 'ja' ? 'アルペジオの方向' : 'Arpeggio Direction'}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={direction} onChange={(e) => setDirection(e.target.value as ArpeggioDirection)} style={{ flex: 1 }}>
                <option value="up">{lang === 'ja' ? '上行 (ルート音から)' : 'Up (Root to 7th)'}</option>
                <option value="down">{lang === 'ja' ? '下行 (7thから)' : 'Down (7th to Root)'}</option>
                <option value="random">{lang === 'ja' ? 'ランダム (コード構成音)' : 'Randomize (All Chord Tones)'}</option>
                <option value="root">{lang === 'ja' ? 'ルート音のみ' : 'Root Only'}</option>
                <option value="root3">{lang === 'ja' ? 'ルート音＋3rd (ランダム装飾)' : 'Root & 3rd (Random Ornamental)'}</option>
              </select>
              {(direction === 'random' || direction === 'root3') && onShuffle && (
                <button 
                  onClick={onShuffle}
                  title={lang === 'ja' ? 'ランダムパターンを再生成' : 'Regenerate random pattern'}
                  style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label>{lang === 'ja' ? 'リズムパターン' : 'Rhythm Pattern'}</label>
            <input 
              type="text" 
              value={rhythmPattern} 
              onChange={(e) => setRhythmPattern(e.target.value)}
              placeholder="e.g. 8 8 8 8 8 8 8 8"
            />
          </div>
          <div>
            <label>{lang === 'ja' ? 'タイトル' : 'Title'}</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'ja' ? '楽譜のタイトル' : 'Sheet Music Title'}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
