import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import NoisySphere from './NoisySphere'
import Lighting from './Lighting'
import CameraAnimation from './CameraAnimation'

function App() {
  const orbitControlsRef = useRef()

  return (
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
  )
}

export default App
