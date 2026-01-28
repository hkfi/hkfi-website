import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

// Shared global mouse vector
const mouse = new THREE.Vector2(0, 0)

function GlobalTracker() {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse (-1 to 1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }
  }, [])
  return null
}

interface ModelProps {
  onReady?: () => void
}

function Model({ onReady }: ModelProps) {
  const { scene } = useGLTF('/thinking_emoji/scene-draco.gltf', '/draco/')
  const ref = useRef<THREE.Group>(null)

  // Signal that the model has loaded and mounted
  useEffect(() => {
    onReady?.()
  }, [onReady])

  useFrame(() => {
    if (ref.current) {
        // Create a target vector for the model to look at
        const target = new THREE.Vector3(mouse.x * 5, mouse.y * 5, 5)
        
        // We can use linear interpolation for smoothness if desired,
        // but lookAt directly is responsive and snappy.
        ref.current.lookAt(target)
    }
  })

  // Clone scene to avoid re-use issues if multiple instances (though likely singleton here)
  const { viewport } = useThree()
  
  // Responsive scale logic
  // Base scale is 1.3 for desktop
  // If viewport is small (mobile), scale down
  // Viewport width in Three.js units depends on camera distance
  const scale = viewport.width < 5 ? 0.9 : 1.3
  
  const primitive = scene.clone()

  return (
    <group ref={ref} position={[0, 0, 0]} scale={[scale, scale, scale]}>
      <primitive object={primitive} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/thinking_emoji/scene-draco.gltf', '/draco/')

interface ThinkingEmojiSceneProps {
  onReady?: () => void
}

export default function ThinkingEmojiScene({ onReady }: ThinkingEmojiSceneProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }} 
        style={{ background: 'transparent' }}
      >
        <GlobalTracker />
        
        {/* Lights */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ffd0d0" />
        
        {/* Environment for shiny reflections if the model has PBR materials */}
        <Environment preset="city" />

        <Model onReady={onReady} />

        {/* Shadows for grounded feel */}
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} far={4} resolution={128} frames={1} />
      </Canvas>
    </div>
  )
}
