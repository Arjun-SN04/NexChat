import { useEffect, useRef, useState } from 'react'

export const MAX_VOICE_SECONDS = 120
// ~32 kbps Opus: clear speech at roughly 240 KB per minute (keeps storage low)
const AUDIO_BITS_PER_SECOND = 32000

const pickMimeType = () =>
  ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    .find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || ''

// Records a voice note with the microphone.
// start() begins recording, finish() resolves with the audio Blob, cancel() discards it.
const useVoiceRecorder = () => {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const recorder = useRef(null)
  const chunks = useRef([])
  const timer = useRef(null)
  const onDone = useRef(null)

  const cleanup = () => {
    clearInterval(timer.current)
    recorder.current?.stream?.getTracks().forEach((t) => t.stop())
    setRecording(false)
  }

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice notes aren't supported in this browser.")
      return false
    }
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow it in your browser settings.'
        : "Couldn't access the microphone.")
      return false
    }

    const mimeType = pickMimeType()
    const rec = new MediaRecorder(stream, { ...(mimeType && { mimeType }), audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
    chunks.current = []
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
    rec.onstop = () => {
      const type = (rec.mimeType || 'audio/webm').split(';')[0]
      onDone.current?.(new Blob(chunks.current, { type }))
      onDone.current = null
    }
    rec.start(250)
    recorder.current = rec
    setSeconds(0)
    setRecording(true)
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return true
  }

  const finish = () =>
    new Promise((resolve) => {
      if (!recorder.current || recorder.current.state === 'inactive') return resolve(null)
      onDone.current = resolve
      recorder.current.stop()
      cleanup()
    })

  const cancel = () => {
    onDone.current = null
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
    cleanup()
  }

  // Release the microphone if the component goes away mid-recording
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => cancel, [])

  return { recording, seconds, error, setError, start, finish, cancel }
}

export default useVoiceRecorder
