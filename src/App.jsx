import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import NoisySphere from './NoisySphere'

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#000000']} />
      <Environment preset="sunset" />
      <NoisySphere />
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  )
}

export default App
