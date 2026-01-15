import { useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import NoisySphere from './NoisySphere'
import Lighting from './Lighting'
import CameraAnimation from './CameraAnimation'
import ControlsDrawer from './ControlsDrawer'

function CameraAdjuster({ isDrawerOpen, isMobile, orbitControlsRef }) {
  const { camera } = useThree()
  const savedDistanceRef = useRef(null)
  const previousDrawerStateRef = useRef(isDrawerOpen)

  useEffect(() => {
    if (!isMobile || !orbitControlsRef.current) return

    const controls = orbitControlsRef.current
    const currentOffset = camera.position.clone().sub(controls.target)
    const currentDistance = currentOffset.length()
    const direction = currentOffset.normalize()

    // Detect drawer state change
    const drawerJustOpened = !previousDrawerStateRef.current && isDrawerOpen
    const drawerJustClosed = previousDrawerStateRef.current && !isDrawerOpen

    if (drawerJustOpened) {
      // Save the current distance when drawer opens
      savedDistanceRef.current = currentDistance
      // Zoom in
      const targetDistance = savedDistanceRef.current * 0.6
      camera.position.copy(controls.target).add(direction.multiplyScalar(targetDistance))
    } else if (drawerJustClosed && savedDistanceRef.current !== null) {
      // Restore to the exact saved distance when drawer closes
      camera.position.copy(controls.target).add(direction.multiplyScalar(savedDistanceRef.current))
    }

    previousDrawerStateRef.current = isDrawerOpen
  }, [isDrawerOpen, isMobile, camera, orbitControlsRef])

  return null
}

function App() {
  const orbitControlsRef = useRef()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const canvasStyle = {
    width: '100vw',
    height: isMobile && isDrawerOpen ? '40vh' : '100vh',
    transition: 'height 0.3s ease'
  }

  // Move camera back on mobile to prevent clipping
  const cameraPosition = isMobile ? [0, 0, 8] : [0, 0, 5]

  return (
    <>
      <div style={canvasStyle}>
        <Canvas camera={{ position: cameraPosition, fov: 50 }}>
          <Lighting />
          <NoisySphere />
          <CameraAnimation orbitControlsRef={orbitControlsRef} />
          <CameraAdjuster isDrawerOpen={isDrawerOpen} isMobile={isMobile} orbitControlsRef={orbitControlsRef} />
          <OrbitControls
            ref={orbitControlsRef}
            enablePan={false}
            enableZoom={true}
          />
          <EffectComposer>
            <DepthOfField focusDistance={0.025} focalLength={0.05} bokehScale={4} height={480} />
            <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} height={300} intensity={1.0} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>
        </Canvas>
      </div>
      <ControlsDrawer isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} isMobile={isMobile} />
    </>
  )
}

export default App
