import { Suspense, lazy, useState, useEffect } from 'react'

const ThinkingEmojiScene = lazy(() => import('./ThinkingEmojiScene'))

export default function ThinkingEmoji() {
  // Matches the fallback in index.astro for seamless transition
  const Fallback = (
    <div className="w-full h-full flex items-center justify-center">
       <span className="text-[180px]">🤔</span>
    </div>
  )

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Delay loading the 3D scene slightly to allow the main thread to clear up
    // Just a small tick is enough to separate it from the critical path
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) return Fallback

  return (
    <Suspense fallback={Fallback}>
       <ThinkingEmojiScene />
    </Suspense>
  )
}
