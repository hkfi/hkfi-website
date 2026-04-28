import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

// Shared pointer vector, normalized around the emoji canvas rather than the viewport.
const mouse = new THREE.Vector2(0, 0)
const lookOffset = new THREE.Vector2(0, 0)
const lookTarget = new THREE.Vector3(0, 0, 5)

const MAX_LOOK_DISTANCE = 1
const LOOK_OFFSET = 1.7
const LOOK_DEPTH = 5

function GlobalTracker() {
  const { gl } = useThree()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()

      // Normalize against the canvas so (0, 0) is the emoji's screen position.
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [gl])
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
      lookOffset.copy(mouse).clampLength(0, MAX_LOOK_DISTANCE)
      lookTarget.set(
        lookOffset.x * LOOK_OFFSET,
        lookOffset.y * LOOK_OFFSET,
        LOOK_DEPTH
      )

      ref.current.lookAt(lookTarget)
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

export default function ThinkingEmojiScene({
  onReady
}: ThinkingEmojiSceneProps) {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <GlobalTracker />

        {/* Lights */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color='#ffd0d0' />

        {/* Environment for shiny reflections if the model has PBR materials */}
        <Environment preset='city' />

        <Model onReady={onReady} />

        {/* Shadows for grounded feel */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.4}
          scale={5}
          blur={2.5}
          far={4}
          resolution={128}
          frames={1}
        />
      </Canvas>
    </div>
  )
}
