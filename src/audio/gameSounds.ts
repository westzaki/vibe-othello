let audioContext: AudioContext | null = null;

export function unlockGameAudio() {
  const context = getAudioContext();

  if (context === null || context.state !== "suspended") {
    return;
  }

  void context.resume();
}

export function playPlaceDiscSound() {
  playTapSound({
    attackSeconds: 0.006,
    chimeGain: 0.01,
    chimeRatio: 1.54,
    decaySeconds: 0.14,
    frequency: 245,
    gain: 0.07,
    noiseGain: 0.009,
    pitchDropRatio: 0.78,
  });
}

export function playFlipDiscSound() {
  playTapSound({
    attackSeconds: 0.005,
    chimeGain: 0.006,
    chimeRatio: 1.44,
    decaySeconds: 0.105,
    frequency: 435,
    gain: 0.043,
    noiseGain: 0.006,
    pitchDropRatio: 0.9,
  });
}

function playTapSound({
  attackSeconds,
  chimeGain,
  chimeRatio,
  decaySeconds,
  frequency,
  gain,
  noiseGain,
  pitchDropRatio,
}: {
  attackSeconds: number;
  chimeGain: number;
  chimeRatio: number;
  decaySeconds: number;
  frequency: number;
  gain: number;
  noiseGain: number;
  pitchDropRatio: number;
}) {
  const context = getAudioContext();

  if (context === null) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  const chime = context.createOscillator();
  const chimeGainNode = context.createGain();
  const toneFilter = context.createBiquadFilter();
  const noise = createNoiseSource(context);
  const noiseFilter = context.createBiquadFilter();
  const noiseGainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(80, frequency * pitchDropRatio),
    now + decaySeconds,
  );
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(1200, now);
  toneFilter.Q.setValueAtTime(0.7, now);
  oscillatorGain.gain.setValueAtTime(0.0001, now);
  oscillatorGain.gain.exponentialRampToValueAtTime(gain, now + attackSeconds);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + decaySeconds);

  chime.type = "sine";
  chime.frequency.setValueAtTime(frequency * chimeRatio, now);
  chime.frequency.exponentialRampToValueAtTime(
    frequency * chimeRatio * 1.08,
    now + decaySeconds * 0.75,
  );
  chimeGainNode.gain.setValueAtTime(0.0001, now);
  chimeGainNode.gain.exponentialRampToValueAtTime(
    chimeGain,
    now + attackSeconds * 1.4,
  );
  chimeGainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    now + decaySeconds * 0.82,
  );

  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(frequency * 1.35, now);
  noiseFilter.Q.setValueAtTime(1.1, now);
  noiseGainNode.gain.setValueAtTime(noiseGain, now);
  noiseGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  oscillator.connect(toneFilter);
  toneFilter.connect(oscillatorGain);
  oscillatorGain.connect(context.destination);
  chime.connect(chimeGainNode);
  chimeGainNode.connect(context.destination);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGainNode);
  noiseGainNode.connect(context.destination);

  oscillator.start(now);
  chime.start(now);
  noise.start(now);
  oscillator.stop(now + decaySeconds + 0.03);
  chime.stop(now + decaySeconds + 0.03);
  noise.stop(now + 0.055);
}

function createNoiseSource(context: AudioContext): AudioBufferSourceNode {
  const sampleCount = Math.floor(context.sampleRate * 0.04);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();

  source.buffer = buffer;

  return source;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  audioContext ??= new AudioContext();

  return audioContext;
}
