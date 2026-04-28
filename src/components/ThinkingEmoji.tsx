import {
  Suspense,
  lazy,
  useState,
  useEffect,
  useTransition,
  useRef,
  useCallback
} from 'react'

const ThinkingEmojiScene = lazy(() => import('./ThinkingEmojiScene'))

const THOUGHTS = [
  'It works on my machine.',
  'Names are hard.',
  'The tests pass. Suspicious.',
  'Just one more refactor.',
  "Maybe it's a data problem.",
  'Future me will know.'
]

export default function ThinkingEmoji() {
  // Matches the fallback in index.astro for seamless transition
  const Fallback = (
    <div className='pointer-events-none flex h-full w-full select-none items-center justify-center'>
      <span className='text-[180px]'>🤔</span>
    </div>
  )

  const [shouldLoad, setShouldLoad] = useState(false)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [thought, setThought] = useState(THOUGHTS[0])
  const [isThoughtVisible, setIsThoughtVisible] = useState(false)
  const [reactionSeed, setReactionSeed] = useState(0)
  const [_, startTransition] = useTransition()
  const thoughtTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reactToInteraction = useCallback(() => {
    setThought((currentThought) => {
      const currentIndex = THOUGHTS.indexOf(currentThought)
      const nextIndex = (currentIndex + 1) % THOUGHTS.length
      return THOUGHTS[nextIndex]
    })
    setReactionSeed((seed) => seed + 1)
    setIsThoughtVisible(true)

    if (thoughtTimer.current) clearTimeout(thoughtTimer.current)
    thoughtTimer.current = setTimeout(() => {
      setIsThoughtVisible(false)
    }, 1800)
  }, [])

  useEffect(() => {
    // Delay loading the 3D scene slightly to allow the main thread to clear up
    const timer = setTimeout(() => {
      startTransition(() => {
        setShouldLoad(true)
      })
    }, 100)
    return () => {
      clearTimeout(timer)
      if (thoughtTimer.current) clearTimeout(thoughtTimer.current)
    }
  }, [])

  return (
    <div
      className='group relative h-full w-full cursor-pointer outline-none'
      role='button'
      tabIndex={0}
      aria-label='Thinking emoji'
      onClick={reactToInteraction}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          reactToInteraction()
        }
      }}
    >
      {/* 
        The Fallback stays visible until the scene reports it is ready.
        It is absolutely positioned to sit on top (or behind) the canvas during the transition.
      */}
      {!isSceneReady && <div className='absolute inset-0 z-10'>{Fallback}</div>}

      <div
        className={`thinking-bubble pointer-events-none absolute right-0 top-10 z-20 w-max max-w-[min(360px,calc(100vw-2rem))] whitespace-normal px-4 py-2.5 text-sm font-bold leading-none transition-all duration-300 ${
          isThoughtVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-95 opacity-0'
        }`}
        aria-hidden={!isThoughtVisible}
        aria-live='polite'
      >
        <svg
          className='thinking-bubble-shell absolute inset-0 h-full w-full overflow-visible'
          viewBox='0 0 100 52'
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <path
            className='thinking-bubble-shape'
            d='M8 0.5H92C96.14 0.5 99.5 3.86 99.5 8V29.75C99.5 33.89 96.14 37.25 92 37.25H83.5C78.7 37.25 76.1 43.45 73.5 51C70.9 43.45 68.3 37.25 63.5 37.25H8C3.86 37.25 0.5 33.89 0.5 29.75V8C0.5 3.86 3.86 0.5 8 0.5Z'
          />
        </svg>
        <span className='relative z-10'>{thought}</span>
      </div>

      {/* 
        We load the scene in the background. 
        Once it's ready (hydrated and canvas created), it calls onReady.
      */}
      {shouldLoad && (
        <Suspense fallback={null}>
          <ThinkingEmojiScene
            reactionSeed={reactionSeed}
            onReady={() => setIsSceneReady(true)}
          />
        </Suspense>
      )}
    </div>
  )
}
