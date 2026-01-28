import { Suspense, lazy, useState, useEffect, useTransition } from 'react'

const ThinkingEmojiScene = lazy(() => import('./ThinkingEmojiScene'))

export default function ThinkingEmoji() {
  // Matches the fallback in index.astro for seamless transition
  const Fallback = (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
       <span className="text-[180px]">🤔</span>
    </div>
  )

  const [shouldLoad, setShouldLoad] = useState(false)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [_, startTransition] = useTransition()

  useEffect(() => {
    // Delay loading the 3D scene slightly to allow the main thread to clear up
    const timer = setTimeout(() => {
      startTransition(() => {
        setShouldLoad(true)
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* 
        The Fallback stays visible until the scene reports it is ready.
        It is absolutely positioned to sit on top (or behind) the canvas during the transition.
      */}
      {!isSceneReady && (
        <div className="absolute inset-0 z-10">
          {Fallback}
        </div>
      )}

      {/* 
        We load the scene in the background. 
        Once it's ready (hydrated and canvas created), it calls onReady.
      */}
      {shouldLoad && (
        <Suspense fallback={null}>
           <ThinkingEmojiScene onReady={() => setIsSceneReady(true)} />
        </Suspense>
      )}
    </div>
  )
}

