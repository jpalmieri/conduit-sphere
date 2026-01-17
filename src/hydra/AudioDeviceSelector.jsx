import { useState, useEffect } from 'react'
import { getAudioDevices } from './AudioManager'

function AudioDeviceSelector({ onDeviceSelect, selectedDeviceId }) {
  const [devices, setDevices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadDevices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const audioDevices = await getAudioDevices()
      setDevices(audioDevices)
      // Auto-select first device if none selected
      if (audioDevices.length > 0 && !selectedDeviceId) {
        onDeviceSelect(audioDevices[0].deviceId)
      }
    } catch (err) {
      setError('Failed to load audio devices')
      console.error(err)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    // Listen for device changes
    navigator.mediaDevices?.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', loadDevices)
    }
  }, [])

  const handleChange = (e) => {
    onDeviceSelect(e.target.value || null)
  }

  const selectStyle = {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
  }

  if (devices.length === 0) {
    return (
      <button
        onClick={loadDevices}
        disabled={isLoading}
        style={{
          ...selectStyle,
          backgroundColor: '#3a3a3a',
          border: '1px solid #4CAF50',
        }}
      >
        {isLoading ? 'Loading...' : 'Enable Audio Input'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ color: '#888', fontSize: 11, fontFamily: 'system-ui' }}>
        Audio Input Device
      </label>
      <select
        value={selectedDeviceId || ''}
        onChange={handleChange}
        style={selectStyle}
      >
        <option value="">Select audio device...</option>
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ color: '#ff6b6b', fontSize: 11 }}>{error}</span>
      )}
    </div>
  )
}

export default AudioDeviceSelector
