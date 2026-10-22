// Ringing sounds made with the Web Audio API, so no audio files are needed.
// Each start function returns a stop() function.

let ctx = null
const audio = () => {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// Play `freqs` together for `ms`, starting `at` seconds from now
const beep = (ac, freqs, at, ms, volume = 0.06) => {
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, ac.currentTime + at)
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + at + 0.02)
  gain.gain.setValueAtTime(volume, ac.currentTime + at + ms / 1000 - 0.03)
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + at + ms / 1000)
  gain.connect(ac.destination)
  for (const f of freqs) {
    const osc = ac.createOscillator()
    osc.frequency.value = f
    osc.connect(gain)
    osc.start(ac.currentTime + at)
    osc.stop(ac.currentTime + at + ms / 1000)
  }
}

const loop = (play, everyMs) => {
  const ac = audio()
  if (!ac) return () => {}
  play(ac)
  const id = setInterval(() => play(ac), everyMs)
  return () => clearInterval(id)
}

// What the caller hears while waiting: a long tone every few seconds
export const startRingback = () => loop((ac) => beep(ac, [440, 480], 0, 1500, 0.04), 4000)

// What the person being called hears: two short rings
export const startRingtone = () =>
  loop((ac) => {
    beep(ac, [880, 1320], 0, 350)
    beep(ac, [880, 1320], 0.5, 350)
  }, 2500)

// Short "call ended" blip
export const playEndTone = () => {
  const ac = audio()
  if (ac) beep(ac, [480], 0, 250, 0.05)
}
