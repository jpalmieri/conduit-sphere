import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import HydraSphere from './hydra/HydraSphere'
import HydraPostFX from './hydra/HydraPostFX'
import AudioDeviceSelector from './hydra/AudioDeviceSelector'
import CodeOverlay from './hydra/CodeOverlay'
import { defaultCode, defaultPostFxCode } from './hydra/hydraPresets'
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
    duration: 250
  })

  useEffect(() => {
    if (!isMobile || !orbitControlsRef.current) return

    const controls = orbitControlsRef.current
    const currentOffset = camera.position.clone().sub(controls.target)
    const currentDistance = currentOffset.length()

    const drawerJustOpened = !previousDrawerStateRef.current && isDrawerOpen
    const drawerJustClosed = previousDrawerStateRef.current && !isDrawerOpen

    if (drawerJustOpened) {
      savedDistanceRef.current = currentDistance
      animationRef.current = {
        isAnimating: true,
        startDistance: currentDistance,
        targetDistance: savedDistanceRef.current * 0.6,
        startTime: performance.now(),
        duration: 250
      }
    } else if (drawerJustClosed && savedDistanceRef.current !== null) {
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

    const eased = 1 - Math.pow(1 - progress, 3)
    const newDistance = THREE.MathUtils.lerp(anim.startDistance, anim.targetDistance, eased)

    const currentOffset = camera.position.clone().sub(controls.target)
    const direction = currentOffset.normalize()
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance))

    if (progress >= 1) {
      anim.isAnimating = false
    }
  })

  return null
}

function HydraApp() {
  const orbitControlsRef = useRef()
  const postFxMountRef = useRef(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isViewAdjusted, setIsViewAdjusted] = useState(false)
  const [isZoomAdjusted, setIsZoomAdjusted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Hydra state
  const [hydraCode, setHydraCode] = useState(defaultCode)
  const [hydraError, setHydraError] = useState(null)
  const [postFxCode, setPostFxCode] = useState(defaultPostFxCode)
  const [postFxError, setPostFxError] = useState(null)
  const [audioDeviceId, setAudioDeviceId] = useState(null)

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
      setIsDrawerOpen(true)
      setTimeout(() => setIsViewAdjusted(true), 50)
      setTimeout(() => setIsZoomAdjusted(true), 350)
    } else {
      setIsViewAdjusted(false)
      setTimeout(() => setIsDrawerOpen(false), 300)
      setTimeout(() => setIsZoomAdjusted(false), 600)
    }
  }

  const handleRunCode = () => {
    // The code execution happens in HydraSphere via useEffect when hydraCode changes
    // Force a re-render by setting the same code (or we can use a key)
    setHydraCode(code => code)
  }

  const handleRunPostFx = () => {
    setPostFxCode(code => code)
  }

  const canvasStyle = {
    width: '100vw',
    height: isMobile && isViewAdjusted ? '40vh' : '100vh',
    transition: 'height 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  }

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
        <Canvas
          camera={{ position: cameraPosition, fov: 50 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <CameraAnimation orbitControlsRef={orbitControlsRef} />
          <HydraSphere hydraCode={hydraCode} onError={setHydraError} />
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
          <HydraPostFX mountRef={postFxMountRef} code={postFxCode} onError={setPostFxError} audioDeviceId={audioDeviceId} />
        </Canvas>
        <div
          ref={postFxMountRef}
          style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
        />

        {/* Code overlay - Hydra style */}
        <CodeOverlay
          postFxCode={postFxCode}
          onPostFxChange={setPostFxCode}
          onPostFxRun={handleRunPostFx}
          postFxError={postFxError}
          displacementCode={hydraCode}
          onDisplacementChange={setHydraCode}
          onDisplacementRun={handleRunCode}
          displacementError={hydraError}
        />

        {/* Audio device selector - top right */}
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, width: 250 }}>
          <AudioDeviceSelector
            selectedDeviceId={audioDeviceId}
            onDeviceSelect={setAudioDeviceId}
          />
        </div>
      </div>

      {!hideMenu && <ControlsDrawer isOpen={isDrawerOpen} onToggle={handleDrawerToggle} isMobile={isMobile} />}
    </>
  )
}

export default HydraApp
