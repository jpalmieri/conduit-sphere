import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import NoisySphere from './NoisySphere'
import Lighting from './Lighting'
import CameraAnimation from './CameraAnimation'
import ControlsDrawer from './ControlsDrawer'

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

  return (
    <>
      <div style={canvasStyle}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Lighting />
          <NoisySphere />
          <CameraAnimation orbitControlsRef={orbitControlsRef} />
          <OrbitControls ref={orbitControlsRef} enablePan={false} enableZoom={true} />
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
