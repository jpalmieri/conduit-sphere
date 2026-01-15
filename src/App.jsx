import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import NoisySphere from './NoisySphere'
import Lighting from './Lighting'
import CameraAnimation from './CameraAnimation'
import ControlsDrawer from './ControlsDrawer'
import * as THREE from 'three'

function CameraAdjuster({ isDrawerOpen, isMobile, orbitControlsRef }) {
  const { camera } = useThree()
  const savedDistanceRef = useRef(null)
  const previousDrawerStateRef = useRef(isDrawerOpen)
  const animationRef = useRef({
    isAnimating: false,
    startDistance: 0,
    targetDistance: 0,
    startTime: 0,
    duration: 250 // Smooth 250ms animation
  })

  useEffect(() => {
    if (!isMobile || !orbitControlsRef.current) return

    const controls = orbitControlsRef.current
    const currentOffset = camera.position.clone().sub(controls.target)
    const currentDistance = currentOffset.length()

    // Detect drawer state change
    const drawerJustOpened = !previousDrawerStateRef.current && isDrawerOpen
    const drawerJustClosed = previousDrawerStateRef.current && !isDrawerOpen

    if (drawerJustOpened) {
      // Save the current distance when drawer opens
      savedDistanceRef.current = currentDistance
      // Start animation to zoom in
      animationRef.current = {
        isAnimating: true,
        startDistance: currentDistance,
        targetDistance: savedDistanceRef.current * 0.6,
        startTime: performance.now(),
        duration: 250
      }
    } else if (drawerJustClosed && savedDistanceRef.current !== null) {
      // Start animation to restore to the exact saved distance
      animationRef.current = {
        isAnimating: true,
        startDistance: currentDistance,
        targetDistance: savedDistanceRef.current,
        startTime: performance.now(),
        duration: 250
      }
    }

    previousDrawerStateRef.current = isDrawerOpen
  }, [isDrawerOpen, isMobile, camera, orbitControlsRef])

  useFrame(() => {
    if (!isMobile || !orbitControlsRef.current || !animationRef.current.isAnimating) return

    const controls = orbitControlsRef.current
    const anim = animationRef.current
    const elapsed = performance.now() - anim.startTime
    const progress = Math.min(elapsed / anim.duration, 1)

    // Smooth ease-out cubic easing
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate distance
    const newDistance = THREE.MathUtils.lerp(anim.startDistance, anim.targetDistance, eased)

    // Update camera position
    const currentOffset = camera.position.clone().sub(controls.target)
    const direction = currentOffset.normalize()
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance))

    if (progress >= 1) {
      anim.isAnimating = false
    }
  })

  return null
}

function App() {
  const orbitControlsRef = useRef()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isViewAdjusted, setIsViewAdjusted] = useState(false)
  const [isZoomAdjusted, setIsZoomAdjusted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check for hideMenu URL parameter
  const hideMenu = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.has('hideMenu')
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleDrawerToggle = (newOpenState) => {
    if (newOpenState) {
      // Opening: drawer opens first, then height adjusts, then zoom
      setIsDrawerOpen(true)
      setTimeout(() => setIsViewAdjusted(true), 50)
      setTimeout(() => setIsZoomAdjusted(true), 350) // 50ms + 300ms transition
    } else {
      // Closing: height adjusts first, then drawer closes, then zoom
      setIsViewAdjusted(false)
      setTimeout(() => setIsDrawerOpen(false), 300)
      setTimeout(() => setIsZoomAdjusted(false), 600) // 300ms + 300ms transition
    }
  }

  const canvasStyle = {
    width: '100vw',
    height: isMobile && isViewAdjusted ? '40vh' : '100vh',
    transition: 'height 0.3s ease'
  }

  // Move camera back on mobile to prevent clipping
  const cameraPosition = isMobile ? [0, 0, 8] : [0, 0, 5]

  return (
    <>
      {hideMenu && (
        <style>{`
          .leva-c-kWgxhW {
            display: none !important;
          }
        `}</style>
      )}
      <div style={canvasStyle}>
        <Canvas camera={{ position: cameraPosition, fov: 50 }}>
          <CameraAnimation orbitControlsRef={orbitControlsRef} />
          <NoisySphere />
          <Lighting />
          <CameraAdjuster isDrawerOpen={isZoomAdjusted} isMobile={isMobile} orbitControlsRef={orbitControlsRef} />
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
      {!hideMenu && <ControlsDrawer isOpen={isDrawerOpen} onToggle={handleDrawerToggle} isMobile={isMobile} />}
    </>
  )
}

export default App
