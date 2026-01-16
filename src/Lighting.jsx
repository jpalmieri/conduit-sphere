import { useEffect, useMemo, useRef } from 'react'
import { useControls } from 'leva'
import { Environment } from '@react-three/drei'

function Lighting() {
  const ambientRef = useRef(null)
  const directionalRef = useRef(null)
  // Read initial values from URL params
  const getInitialValues = () => {
    const params = new URLSearchParams(window.location.search)
    const values = {}

    for (const [key, value] of params.entries()) {
      if (value === 'true' || value === 'false') {
        values[key] = value === 'true'
      } else if (!isNaN(value) && value !== '') {
        values[key] = parseFloat(value)
      } else {
        values[key] = value
      }
    }

    return values
  }

  const urlValues = useMemo(() => getInitialValues(), [])

  const lightingControls = useControls('Lighting', {
    environmentEnabled: { value: urlValues.environmentEnabled ?? true, label: 'Environment' },
    environmentPreset: {
      value: urlValues.environmentPreset || 'dawn',
      options: {
        'City': 'city',
        'Sunset': 'sunset',
        'Dawn': 'dawn',
        'Night': 'night',
        'Warehouse': 'warehouse',
        'Forest': 'forest',
        'Apartment': 'apartment',
        'Studio': 'studio',
        'Park': 'park',
        'Lobby': 'lobby'
      },
      label: 'Preset'
    },
    showBackground: { value: urlValues.showBackground ?? true, label: 'Show Background' },
    ambientLightEnabled: { value: urlValues.ambientLightEnabled ?? false, label: 'Ambient Light' },
    ambientIntensity: { value: urlValues.ambientIntensity ?? 0.5, min: 0, max: 2, step: 0.1, label: 'Ambient Intensity' },
    directionalLightEnabled: { value: urlValues.directionalLightEnabled ?? false, label: 'Directional Light' },
    directionalIntensity: { value: urlValues.directionalIntensity ?? 1.0, min: 0, max: 3, step: 0.1, label: 'Directional Intensity' }
  })

  // Update URL when lighting controls change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    Object.entries(lightingControls).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value)
      }
    })

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [lightingControls])

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.layers.enable(1)
    }
    if (directionalRef.current) {
      directionalRef.current.layers.enable(1)
    }
  }, [lightingControls.ambientLightEnabled, lightingControls.directionalLightEnabled])

  return (
    <>
      {lightingControls.environmentEnabled && (
        <Environment
          preset={lightingControls.environmentPreset}
          background={lightingControls.showBackground}
        />
      )}
      {lightingControls.ambientLightEnabled && (
        <ambientLight ref={ambientRef} intensity={lightingControls.ambientIntensity} />
      )}
      {lightingControls.directionalLightEnabled && (
        <directionalLight
          ref={directionalRef}
          position={[5, 5, 5]}
          intensity={lightingControls.directionalIntensity}
          castShadow
        />
      )}
    </>
  )
}

export default Lighting
