import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import NoisySphere from './NoisySphere'

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <NoisySphere />
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  )
}

export default App
