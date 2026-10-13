


export let audioContext = null;
export let audioReady = false;
export let lastBeat = -1;


/* =========================
   MUSICAL SCALES
========================= */

export const scale = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25  // C5
];

// Set bass scale
export const lowerScales =
  scale.map(num => num / 4);


  /* =========================
     ENABLE AUDIO
  ========================= */
  
  export function enableAudio() {
  
    if (!audioContext) {
  
      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();
    }
  
    if (
      audioContext.state === "suspended"
    ) {
  
      audioContext.resume();
    }
  
    audioReady = true;
  }
  
  
  window.addEventListener(
    "pointerdown",
    enableAudio,
    { once: true }
  );
  
  

  /* =========================
   TEMPO CLICK
========================= */

export function playBeat() {

  if (!audioReady) {
    return;
  }

  const now =
    audioContext.currentTime;

  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  oscillator.type =
    "square";

  oscillator.frequency.setValueAtTime(
    5000,
    now
  );

  gain.gain.setValueAtTime(
    0.02,
    now
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.04
  );

  oscillator.connect(gain);

  gain.connect(
    audioContext.destination
  );

  oscillator.start(now);

  oscillator.stop(
    now + 0.05
  );
}


/* =========================
   PLAY DETECTION SOUND
========================= */

export function playDetectionSound(target,zone) {

  if (!audioReady) {
    return;
  }

  // const zone =
  //   getZone(target.distance);

  const frequency =
    target.y < 0
      ? scale[zone]
      : lowerScales[zone];

  const now =
    audioContext.currentTime;

  const oscillator =
    audioContext.createOscillator();

  const gain =
    audioContext.createGain();

  oscillator.type =
    "sine";

  oscillator.frequency.setValueAtTime(
    frequency,
    now
  );

const peakVolume = 0.15 * Math.pow(target.volume / 127, 2);
gain.gain.setValueAtTime(0, now);
gain.gain.linearRampToValueAtTime(peakVolume, now + 0.025);


  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.75
  );

  oscillator.connect(gain);

  gain.connect(
    audioContext.destination
  );

  oscillator.start(now);

  oscillator.stop(
    now + 0.56
  );
}