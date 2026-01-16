import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { createHydraInstance, executeHydraCode } from './HydraManager'

function HydraPostFX({ mountRef, code, onError }) {
  const { gl, size } = useThree()
  const hydraRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!mountRef?.current || !gl?.domElement || hydraRef.current) return

    const outputCanvas = document.createElement('canvas')
    outputCanvas.style.width = '100%'
    outputCanvas.style.height = '100%'
    outputCanvas.style.display = 'block'
    outputCanvas.style.position = 'absolute'
    outputCanvas.style.inset = '0'
    outputCanvas.width = size.width
    outputCanvas.height = size.height

    mountRef.current.appendChild(outputCanvas)
    canvasRef.current = outputCanvas

    hydraRef.current = createHydraInstance(outputCanvas, {
      width: size.width,
      height: size.height,
    })

    // Feed the Three.js render output into Hydra
    hydraRef.current.synth.s0.init({ src: gl.domElement })

    const result = executeHydraCode(hydraRef.current, code)
    if (!result.success && onError) {
      onError(result.error)
    }

    return () => {
      try {
        hydraRef.current?.synth?.hush()
      } catch {
        // Ignore cleanup errors
      }
      if (mountRef.current?.contains(outputCanvas)) {
        mountRef.current.removeChild(outputCanvas)
      }
      canvasRef.current = null
      hydraRef.current = null
    }
  }, [mountRef, gl, size.width, size.height])

  useEffect(() => {
    if (!hydraRef.current || !code) return
    const result = executeHydraCode(hydraRef.current, code)
    if (!result.success && onError) {
      onError(result.error)
    } else if (onError) {
      onError(null)
    }
  }, [code, onError])

  useEffect(() => {
    if (!hydraRef.current || !canvasRef.current) return
    canvasRef.current.width = size.width
    canvasRef.current.height = size.height
    if (hydraRef.current?.synth?.setResolution) {
      hydraRef.current.synth.setResolution(size.width, size.height)
    }
  }, [size.width, size.height])

  return null
}

export default HydraPostFX

