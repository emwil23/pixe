import { RoundedBox, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MathUtils, SRGBColorSpace, type Group, type Mesh } from 'three'

/** Six art tiles (docs/assets.md), reused around the board. */
const TEXTURES = [1, 2, 3, 4, 5, 6].map((n) => `/media/tile-${n}.webp`)
/** The palette that "bleeds" out of the tiles: the landing art's own colours. */
const PALETTE = ['#2b1d14', '#7a4b2a', '#c98a4b', '#e8d2b0', '#d4ff3a']

const COLS = 4
const ROWS = 3
const CARD_W = 1.15
const CARD_H = 0.85
const GAP = 0.14

interface CardSpec {
  /** Where it floats before the scroll, and where it lands on the board. */
  from: [number, number, number]
  fromRot: [number, number, number]
  to: [number, number, number]
  texture: number
  delay: number
  /** Offset for the idle bob, so cards don't move in step. */
  phase: number
}

function makeCards(): CardSpec[] {
  const cards: CardSpec[] = []
  // A seeded shuffle, so prerender and every visit look the same.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      cards.push({
        // Always between the board and the camera, so no card hides behind the slab.
        from: [rand() * 3.4, rand() * 2.2, 0.8 + (rand() + 1) * 0.9],
        fromRot: [rand() * 0.6, rand() * 0.8, rand() * 0.5],
        to: [(c - (COLS - 1) / 2) * (CARD_W + GAP), ((ROWS - 1) / 2 - r) * (CARD_H + GAP), 0.05],
        texture: i % TEXTURES.length,
        delay: (i / (COLS * ROWS)) * 0.35,
        phase: (rand() + 1) * 5,
      })
    }
  return cards
}

/** Scroll progress through the hero, 0 to 1, read every frame without re-rendering React. */
type Progress = { current: number }

const ease = (t: number) => 1 - Math.pow(1 - MathUtils.clamp(t, 0, 1), 3)

function Card({ spec, progress, map }: { spec: CardSpec; progress: Progress; map: unknown }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const g = ref.current
    if (!g) return
    // Each card lands a little after the one before it.
    const p = ease((progress.current - spec.delay) / 0.55)
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + spec.phase) * 0.08 * (1 - p)
    g.position.set(
      MathUtils.lerp(spec.from[0], spec.to[0], p),
      MathUtils.lerp(spec.from[1], spec.to[1], p) + bob,
      MathUtils.lerp(spec.from[2], spec.to[2], p),
    )
    g.rotation.set(spec.fromRot[0] * (1 - p), spec.fromRot[1] * (1 - p), spec.fromRot[2] * (1 - p))
  })
  return (
    <group ref={ref}>
      {/* The print border. */}
      <mesh>
        <boxGeometry args={[CARD_W, CARD_H, 0.02]} />
        <meshStandardMaterial color="#f4f0e8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[CARD_W - 0.08, CARD_H - 0.08]} />
        <meshStandardMaterial map={map as never} roughness={0.6} />
      </mesh>
    </group>
  )
}

function Swatch({ color, index, progress }: { color: string; index: number; progress: Progress }) {
  const ref = useRef<Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    // The palette rises out of the board after the cards have landed.
    const p = ease((progress.current - 0.62 - index * 0.06) / 0.3)
    m.scale.set(1, Math.max(0.001, p), 1)
    m.position.y = -((ROWS * (CARD_H + GAP)) / 2) - 0.45 + (p * 0.35) / 2
  })
  const width = (COLS * (CARD_W + GAP) - GAP) / PALETTE.length
  return (
    <RoundedBox
      ref={ref}
      args={[width - 0.04, 0.35, 0.12]}
      radius={0.03}
      position={[(index - (PALETTE.length - 1) / 2) * width, 0, 0.08]}
    >
      <meshStandardMaterial color={color} roughness={0.35} />
    </RoundedBox>
  )
}

/** The floating board: tilts toward the pointer, and straightens as the cards land. */
function Board({ progress }: { progress: Progress }) {
  const group = useRef<Group>(null)
  const { pointer } = useThree()
  const cards = useMemo(() => makeCards(), [])
  const maps = useTexture(TEXTURES)
  maps.forEach((m) => (m.colorSpace = SRGBColorSpace))

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const k = Math.min(1, delta * 3)
    const p = progress.current
    g.rotation.y += (pointer.x * 0.2 - 0.35 * (1 - p) - g.rotation.y) * k
    g.rotation.x += (-pointer.y * 0.12 - 0.25 + 0.1 * p - g.rotation.x) * k
  })

  const boardW = COLS * (CARD_W + GAP) + 0.4
  const boardH = ROWS * (CARD_H + GAP) + 1.1
  return (
    <group ref={group} position={[0.55, 0.15, 0]} scale={0.62}>
      {/* The board itself: a dark slab, like the light table in the app. */}
      <RoundedBox args={[boardW, boardH, 0.08]} radius={0.06} position={[0, -0.25, -0.06]}>
        <meshStandardMaterial color="#181614" roughness={0.9} />
      </RoundedBox>
      {cards.map((c, i) => (
        <Card key={i} spec={c} progress={progress} map={maps[c.texture]} />
      ))}
      {PALETTE.map((c, i) => (
        <Swatch key={c} color={c} index={i} progress={progress} />
      ))}
    </group>
  )
}

export default function Hero3D({ progress }: { progress: Progress }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  // Stop rendering once the hero scrolls out of view.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        className="!absolute inset-0"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 6]} intensity={1.7} color="#fff3e0" />
        <pointLight position={[-4, -2, 3]} intensity={18} color="#d4ff3a" distance={10} />
        <Board progress={progress} />
      </Canvas>
    </div>
  )
}
