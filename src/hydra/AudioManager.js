import Meyda from 'meyda'

let audioContext = null
let currentStream = null
let meydaAnalyzer = null
let fftData = [0, 0, 0, 0]

export async function getAudioDevices() {
  // Request permission first to get device labels
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
  } catch (err) {
    console.warn('Could not get audio permission:', err)
    return []
  }

  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices
    .filter(device => device.kind === 'audioinput')
    .map(device => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
    }))
}

export async function initializeAudio(deviceId, hydraAudio) {
  // Clean up previous stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
  }
  if (meydaAnalyzer) {
    meydaAnalyzer.stop()
  }

  // Initialize fft array on hydra audio object immediately
  if (hydraAudio) {
    hydraAudio.fft = [0, 0, 0, 0]
  }

  const constraints = {
    audio: deviceId ? { deviceId: { exact: deviceId } } : true
  }

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints)

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext()
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const source = audioContext.createMediaStreamSource(currentStream)

    meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext,
      source,
      bufferSize: 512,
      featureExtractors: ['loudness'],
      callback: (features) => {
        if (features && features.loudness) {
          // Map loudness bands to 4 FFT bins like Hydra does
          const specific = features.loudness.specific
          const binSize = Math.floor(specific.length / 4)

          for (let i = 0; i < 4; i++) {
            const start = i * binSize
            const end = (i + 1) * binSize
            const sum = specific.slice(start, end).reduce((a, b) => a + b, 0)
            // Normalize and smooth
            fftData[i] = fftData[i] * 0.4 + (sum / 10) * 0.6
          }

          // Update Hydra's audio object if provided
          if (hydraAudio) {
            hydraAudio.fft = [...fftData]
          }
        }
      }
    })

    meydaAnalyzer.start()

    return { success: true, fftData }
  } catch (err) {
    console.error('Failed to initialize audio:', err)
    return { success: false, error: err }
  }
}

export function getFFTData() {
  return fftData
}

export function cleanupAudio() {
  if (meydaAnalyzer) {
    meydaAnalyzer.stop()
    meydaAnalyzer = null
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
    audioContext = null
  }
  fftData = [0, 0, 0, 0]
}
