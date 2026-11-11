// Generates the game's sound effects as small WAV files (no downloads, no licences).
// Run: node tools-make-sounds.cjs   (writes into app/assets/sounds)
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

// notes: list of { frequency, start, duration, volume, wave }
function renderSound(notes) {
  const totalSeconds = Math.max(...notes.map((note) => note.start + note.duration)) + 0.05;
  const samples = new Float32Array(Math.ceil(totalSeconds * SAMPLE_RATE));
  for (const note of notes) {
    const firstSample = Math.floor(note.start * SAMPLE_RATE);
    const sampleCount = Math.floor(note.duration * SAMPLE_RATE);
    for (let offset = 0; offset < sampleCount; offset++) {
      const time = offset / SAMPLE_RATE;
      const phase = 2 * Math.PI * note.frequency * time;
      let waveValue = Math.sin(phase);
      if (note.wave === 'square') waveValue = Math.sign(waveValue) * 0.6;
      if (note.wave === 'bright') waveValue = Math.sin(phase) * 0.7 + Math.sin(2 * phase) * 0.3;
      // Quick attack, smooth exponential fade so there are no clicks.
      const attack = Math.min(1, time / 0.008);
      const release = Math.exp(-time * (note.decay ?? 6));
      const tailFade = Math.min(1, (sampleCount - offset) / (0.01 * SAMPLE_RATE));
      samples[firstSample + offset] += waveValue * attack * release * tailFade * note.volume;
    }
  }
  return samples;
}

function writeWav(filePath, samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24); buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(dataBytes, 40);
  samples.forEach((sampleValue, sampleIndex) => {
    const clamped = Math.max(-1, Math.min(1, sampleValue));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + sampleIndex * 2);
  });
  fs.writeFileSync(filePath, buffer);
}

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, A4: 440, F4: 349.23, D4: 293.66, G4: 392, B4: 493.88, E6: 1318.5 };

const SOUNDS = {
  tap: [{ frequency: 880, start: 0, duration: 0.06, volume: 0.35, wave: 'sine', decay: 40 }],
  correct: [
    { frequency: NOTE.E5, start: 0, duration: 0.12, volume: 0.45, wave: 'bright', decay: 10 },
    { frequency: NOTE.C6, start: 0.09, duration: 0.25, volume: 0.45, wave: 'bright', decay: 8 },
  ],
  wrong: [
    { frequency: NOTE.D4, start: 0, duration: 0.14, volume: 0.35, wave: 'square', decay: 12 },
    { frequency: 220, start: 0.12, duration: 0.25, volume: 0.35, wave: 'square', decay: 10 },
  ],
  complete: [
    { frequency: NOTE.C5, start: 0, duration: 0.15, volume: 0.4, wave: 'bright', decay: 6 },
    { frequency: NOTE.E5, start: 0.12, duration: 0.15, volume: 0.4, wave: 'bright', decay: 6 },
    { frequency: NOTE.G5, start: 0.24, duration: 0.15, volume: 0.4, wave: 'bright', decay: 6 },
    { frequency: NOTE.C6, start: 0.36, duration: 0.5, volume: 0.45, wave: 'bright', decay: 4 },
  ],
  fail: [
    { frequency: NOTE.G4, start: 0, duration: 0.2, volume: 0.35, wave: 'sine', decay: 5 },
    { frequency: NOTE.F4, start: 0.18, duration: 0.2, volume: 0.35, wave: 'sine', decay: 5 },
    { frequency: NOTE.D4, start: 0.36, duration: 0.45, volume: 0.35, wave: 'sine', decay: 4 },
  ],
  rankup: [
    { frequency: NOTE.G4, start: 0, duration: 0.12, volume: 0.35, wave: 'square', decay: 8 },
    { frequency: NOTE.C5, start: 0.1, duration: 0.12, volume: 0.35, wave: 'square', decay: 8 },
    { frequency: NOTE.E5, start: 0.2, duration: 0.12, volume: 0.35, wave: 'square', decay: 8 },
    { frequency: NOTE.G5, start: 0.3, duration: 0.12, volume: 0.35, wave: 'square', decay: 8 },
    { frequency: NOTE.C6, start: 0.4, duration: 0.6, volume: 0.4, wave: 'bright', decay: 3 },
    { frequency: NOTE.E6, start: 0.4, duration: 0.6, volume: 0.2, wave: 'sine', decay: 3 },
  ],
};

const outputFolder = path.join(__dirname, 'app', 'assets', 'sounds');
fs.mkdirSync(outputFolder, { recursive: true });
for (const [soundName, notes] of Object.entries(SOUNDS)) {
  writeWav(path.join(outputFolder, `${soundName}.wav`), renderSound(notes));
}
console.log('wrote', Object.keys(SOUNDS).join(', '));
