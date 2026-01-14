import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import NoisySphere from './NoisySphere'

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <Environment preset="sunset" background />
      <NoisySphere />
      <OrbitControls enablePan={false} enableZoom={true} />
    </Canvas>
  )
}

export default App
