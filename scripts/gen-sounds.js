const fs = require('fs');
const path = require('path');

const SR = 44100;

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filename, buffer);
}

function tone(freqs, dur, envelope) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const [f, amp] of freqs) s += amp * Math.sin(2 * Math.PI * f * t);
    out[i] = s * envelope(t, dur);
  }
  return out;
}

const expDecay = (t, dur) => Math.exp(-4 * (t / dur));
const softBell = (t, dur) => Math.min(1, t / 0.02) * Math.exp(-3 * (t / dur));

// chime: rising two-note ding
function chime() {
  const a = tone([[880, 0.5]], 0.18, expDecay);
  const b = tone([[1318, 0.5]], 0.5, expDecay);
  const out = new Float32Array(a.length + b.length);
  out.set(a, 0);
  for (let i = 0; i < b.length; i++) out[a.length + i] += b[i];
  return out;
}

// bell: fundamental + harmonic, long decay
function bell() {
  return tone(
    [
      [660, 0.5],
      [1320, 0.22],
      [1980, 0.1],
    ],
    1.0,
    expDecay,
  );
}

// soft: gentle low sine
function soft() {
  return tone([[440, 0.5]], 0.6, softBell);
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
writeWav(path.join(dir, 'chime.wav'), chime());
writeWav(path.join(dir, 'bell.wav'), bell());
writeWav(path.join(dir, 'soft.wav'), soft());
console.log('Generated chime.wav, bell.wav, soft.wav');
