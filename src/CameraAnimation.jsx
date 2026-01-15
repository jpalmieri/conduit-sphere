import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'

function CameraAnimation({ orbitControlsRef }) {
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

  const cameraControls = useControls('Camera Animation', {
    cameraAnimEnabled: { value: urlValues.cameraAnimEnabled ?? false, label: 'Rotate' },
    cameraSpeedX: { value: urlValues.cameraSpeedX ?? 0.1, min: -2, max: 2, step: 0.01, label: 'Speed' }
  })

  // Set Y and Z speeds to 0 since we removed those controls
  const cameraSpeedY = 0.0
  const cameraSpeedZ = 0.0

  // Update URL when controls change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    Object.entries(cameraControls).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value)
      }
    })

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [cameraControls])

  useFrame((state, delta) => {
    if (cameraControls.cameraAnimEnabled && orbitControlsRef?.current) {
      const controls = orbitControlsRef.current
      const camera = state.camera

      // Get current position relative to target
      const offset = camera.position.clone().sub(controls.target)

      // Convert to spherical coordinates
      const radius = offset.length()
      let theta = Math.atan2(offset.x, offset.z) // azimuthal angle
      let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) // polar angle

      // Update angles based on speed
      theta += cameraControls.cameraSpeedX * delta
      phi += cameraSpeedY * delta

      // Clamp phi to prevent flipping
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))

      // Update radius (zoom)
      const newRadius = Math.max(2, Math.min(20, radius + cameraSpeedZ * delta))

      // Convert back to cartesian coordinates
      offset.x = newRadius * Math.sin(phi) * Math.sin(theta)
      offset.y = newRadius * Math.cos(phi)
      offset.z = newRadius * Math.sin(phi) * Math.cos(theta)

      // Update camera position
      camera.position.copy(controls.target).add(offset)
      camera.lookAt(controls.target)
    }
  })

  return null
}

export default CameraAnimation
