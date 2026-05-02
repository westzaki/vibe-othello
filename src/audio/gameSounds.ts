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
    attackSeconds: 0.004,
    decaySeconds: 0.09,
    frequency: 170,
    gain: 0.12,
    noiseGain: 0.04,
  });
}

export function playFlipDiscSound() {
  playTapSound({
    attackSeconds: 0.003,
    decaySeconds: 0.07,
    frequency: 520,
    gain: 0.07,
    noiseGain: 0.025,
  });
}

function playTapSound({
  attackSeconds,
  decaySeconds,
  frequency,
  gain,
  noiseGain,
}: {
  attackSeconds: number;
  decaySeconds: number;
  frequency: number;
  gain: number;
  noiseGain: number;
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
  const noise = createNoiseSource(context);
  const noiseFilter = context.createBiquadFilter();
  const noiseGainNode = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(60, frequency * 0.55),
    now + decaySeconds,
  );
  oscillatorGain.gain.setValueAtTime(0.0001, now);
  oscillatorGain.gain.exponentialRampToValueAtTime(gain, now + attackSeconds);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + decaySeconds);

  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(frequency * 2.2, now);
  noiseFilter.Q.setValueAtTime(2.8, now);
  noiseGainNode.gain.setValueAtTime(noiseGain, now);
  noiseGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  oscillator.connect(oscillatorGain);
  oscillatorGain.connect(context.destination);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGainNode);
  noiseGainNode.connect(context.destination);

  oscillator.start(now);
  noise.start(now);
  oscillator.stop(now + decaySeconds + 0.02);
  noise.stop(now + 0.04);
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
