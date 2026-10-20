import { cn } from '@/lib/cn'
import { useEffect, useRef, useState } from 'react'

/**
 * A muted looping clip that downloads and plays only while on screen, and never plays with reduced motion.
 * `src` is the path without extension; a .webm and an .mp4 must both exist.
 */
export function LoopVideo({
  src,
  poster,
  label,
  reduce,
  eagerPoster = false,
  className,
}: {
  src: string
  poster: string
  label: string
  reduce: boolean
  /** Browsers fetch posters straight away; below the fold, wait until the clip is near. */
  eagerPoster?: boolean
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(eagerPoster)

  useEffect(() => {
    const video = ref.current
    if (!video || near) return
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), {
      rootMargin: '600px 0px',
    })
    io.observe(video)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    const video = ref.current
    if (!video || reduce) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void video.play().catch(() => undefined)
      else video.pause()
    })
    io.observe(video)
    return () => io.disconnect()
  }, [reduce])

  return (
    <video
      ref={ref}
      className={cn('object-cover', className)}
      {...(near && { poster })}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  )
}
