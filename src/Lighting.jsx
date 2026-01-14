import { useControls } from 'leva'
import { Environment } from '@react-three/drei'

function Lighting() {
  const lightingControls = useControls('Lighting', {
    environmentEnabled: { value: true, label: 'Environment' },
    environmentPreset: {
      value: 'city',
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
    showBackground: { value: true, label: 'Show Background' },
    ambientLightEnabled: { value: false, label: 'Ambient Light' },
    ambientIntensity: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Ambient Intensity' },
    directionalLightEnabled: { value: false, label: 'Directional Light' },
    directionalIntensity: { value: 1.0, min: 0, max: 3, step: 0.1, label: 'Directional Intensity' }
  })

  return (
    <>
      {lightingControls.environmentEnabled && (
        <Environment
          preset={lightingControls.environmentPreset}
          background={lightingControls.showBackground}
        />
      )}
      {lightingControls.ambientLightEnabled && (
        <ambientLight intensity={lightingControls.ambientIntensity} />
      )}
      {lightingControls.directionalLightEnabled && (
        <directionalLight
          position={[5, 5, 5]}
          intensity={lightingControls.directionalIntensity}
          castShadow
        />
      )}
    </>
  )
}

export default Lighting
