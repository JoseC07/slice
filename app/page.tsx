"use client"

import { useEffect, useRef, useState } from "react"

// Simplified types
type Fruit = {
  id: number
  type: "orange" | "lemon" | "lime"
  x: number
  y: number
  radius: number
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
}

// Simplified sliced fruit type
type SlicedFruit = {
  id: number
  x: number
  y: number
  type: "orange" | "lemon" | "lime"
  radius: number
  rotation: number
  timeLeft: number
  pieces: { dx: number; dy: number }[]
}

// Simplified floating score type
type FloatingScore = {
  id: number
  x: number
  y: number
  value: number
  timeLeft: number
  color: string
}

// Level settings type
type LevelSettings = {
  velocityMultiplier: number
  fruitSpawnInterval: number
  maxFruits: number
  gravityFactor: number
  glowIntensity: number
  primaryColor: string
  secondaryColor: string
  backgroundColor1: string
  backgroundColor2: string
  backgroundColor3: string
  gridColor: string
  mountainColor: string
  foregroundColor: string
  midgroundColor: string
  starsColor: string
  starsCount: number
  cloudColor: string
  cloudCount: number
  pointValue: number
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<"title" | "level_select" | "playing">("title")
  const [level, setLevel] = useState(1)
  const [glitchText, setGlitchText] = useState(false)
  
  // Use refs for better performance with animations
  const fruitsRef = useRef<Fruit[]>([])
  const slicedFruitsRef = useRef<SlicedFruit[]>([])
  const floatingScoresRef = useRef<FloatingScore[]>([])
  const idCounterRef = useRef(0)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)
  
  // Add refs for parallax effect
  const parallaxOffsetRef = useRef({ x: 0, y: 0 })
  const starsPositionsRef = useRef<Array<{x: number, y: number, radius: number, opacity: number, glow: boolean}>>([])
  const cloudsPositionsRef = useRef<Array<{x: number, y: number, radius: number, parts: Array<{dx: number, dy: number, radius: number}>}>>([])
  const parallaxInitializedRef = useRef(false)

  // Fruit colors
  const fruitColors = {
    orange: "#FF6D00",
    lemon: "#FFEA00",
    lime: "#76FF03",
  }
  
  // Level settings
  const levelSettings: Record<number, LevelSettings> = {
    1: {
      velocityMultiplier: 1,
      fruitSpawnInterval: 2000,
      maxFruits: 6,
      gravityFactor: 0.05,
      glowIntensity: 15,
      primaryColor: "#FF00FF",
      secondaryColor: "#00FFFF",
      backgroundColor1: "#0D0221",
      backgroundColor2: "#3D0E61",
      backgroundColor3: "#4A00E0",
      gridColor: "rgba(255, 0, 255, 0.2)",
      mountainColor: "rgba(156, 39, 176, 0.7)",
      foregroundColor: "rgba(76, 29, 149, 0.8)",
      midgroundColor: "rgba(124, 58, 237, 0.5)",
      starsColor: "rgba(255, 255, 255, 0.8)",
      starsCount: 100,
      cloudColor: "rgba(139, 92, 246, 0.3)",
      cloudCount: 5,
      pointValue: 100
    },
    2: {
      velocityMultiplier: 1.5,
      fruitSpawnInterval: 1500,
      maxFruits: 8,
      gravityFactor: 0.07,
      glowIntensity: 25,
      primaryColor: "#FF0080",
      secondaryColor: "#00FFFF",
      backgroundColor1: "#0F0326",
      backgroundColor2: "#4B0082",
      backgroundColor3: "#6A00E0",
      gridColor: "rgba(255, 0, 128, 0.3)",
      mountainColor: "rgba(176, 39, 156, 0.8)",
      foregroundColor: "rgba(88, 28, 135, 0.8)",
      midgroundColor: "rgba(139, 92, 246, 0.5)",
      starsColor: "rgba(255, 255, 255, 0.8)",
      starsCount: 150,
      cloudColor: "rgba(167, 139, 250, 0.3)",
      cloudCount: 7,
      pointValue: 150
    },
    3: {
      velocityMultiplier: 2.2,
      fruitSpawnInterval: 1000,
      maxFruits: 10,
      gravityFactor: 0.1,
      glowIntensity: 35,
      primaryColor: "#FF0000",
      secondaryColor: "#FFFF00",
      backgroundColor1: "#0A001F",
      backgroundColor2: "#300350",
      backgroundColor3: "#8A00E0",
      gridColor: "rgba(255, 0, 0, 0.4)",
      mountainColor: "rgba(220, 39, 39, 0.8)",
      foregroundColor: "rgba(109, 40, 217, 0.8)",
      midgroundColor: "rgba(167, 139, 250, 0.5)",
      starsColor: "rgba(255, 255, 255, 0.9)",
      starsCount: 200,
      cloudColor: "rgba(196, 181, 253, 0.3)",
      cloudCount: 10,
      pointValue: 250
    }
  }

  // Text glitch effect
  useEffect(() => {
    if (gameState !== "playing") {
      const glitchInterval = setInterval(() => {
        setGlitchText(true)
        setTimeout(() => setGlitchText(false), 150)
      }, 3000)

      return () => clearInterval(glitchInterval)
    }
  }, [gameState])

  // Main game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get current level settings
    const settings = levelSettings[level]

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Initialize parallax elements if not already done
    if (!parallaxInitializedRef.current) {
      // Initialize stars positions
      starsPositionsRef.current = Array.from({ length: settings.starsCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        glow: Math.random() > 0.7
      }))
      
      // Initialize clouds positions
      cloudsPositionsRef.current = Array.from({ length: settings.cloudCount }, () => {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height * 0.5
        const radius = Math.random() * 50 + 30
        
        // Create cloud parts
        const parts = Array.from({ length: 5 }, () => ({
          dx: (Math.random() - 0.5) * radius,
          dy: (Math.random() - 0.5) * radius * 0.5,
          radius: radius * (0.5 + Math.random() * 0.5)
        }))
        
        return { x, y, radius, parts }
      })
      
      parallaxInitializedRef.current = true
    }
    
    // Track last time fruits were spawned
    let lastFruitSpawnTime = Date.now()

    // Create a new fruit - simplified
    const createFruit = () => {
      const types = ["orange", "lemon", "lime"] as const
      const type = types[Math.floor(Math.random() * types.length)]
      const radius = Math.random() * 30 + 40 // 40-70 radius
      
      // Distribute fruits across the width of the screen
      const x = Math.random() * (canvas.width - radius * 2) + radius
      const y = -radius * 2 // Start above the screen

      // Generate random velocities - adjusted by level
      const velocityX = (Math.random() - 0.5) * 2 * settings.velocityMultiplier
      const velocityY = (Math.random() * 1 + 0.5) * settings.velocityMultiplier

      fruitsRef.current.push({
        id: idCounterRef.current++,
        type,
        x,
        y,
        radius,
        velocityX,
        velocityY,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02 * settings.velocityMultiplier
      })
    }

    // Function to spawn new fruits
    const spawnFruits = () => {
      // More fruits at higher levels
      const fruitsToCreate = Math.floor(Math.random() * 2) + 1 + Math.floor(level / 2)
      
      for (let i = 0; i < fruitsToCreate; i++) {
        if (fruitsRef.current.length < settings.maxFruits) {
          createFruit()
        }
      }
      
      lastFruitSpawnTime = Date.now()
    }

    // Simplified velocity capping
    const capVelocity = (velocity: number, max: number = 3 * settings.velocityMultiplier): number => {
      if (velocity > max) return max
      if (velocity < -max) return -max
      return velocity
    }

    // Draw background - enhanced with multiple layers for depth and parallax
    const drawBackground = () => {
      // Create deep space gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, settings.backgroundColor1)
      gradient.addColorStop(0.5, settings.backgroundColor2)
      gradient.addColorStop(1, settings.backgroundColor3)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw stars (distant layer) with subtle parallax
      for (const star of starsPositionsRef.current) {
        // Apply parallax effect - distant objects move slower
        const parallaxFactor = 0.2 // Stars move at 20% of mouse movement
        const x = star.x + parallaxOffsetRef.current.x * parallaxFactor
        const y = star.y + parallaxOffsetRef.current.y * parallaxFactor
        
        // Wrap stars around screen edges
        const wrappedX = (x + canvas.width) % canvas.width
        const wrappedY = (y + canvas.height) % canvas.height
        
        ctx.beginPath()
        ctx.arc(wrappedX, wrappedY, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
        
        // Add glow to some stars
        if (star.glow) {
          ctx.shadowColor = settings.starsColor
          ctx.shadowBlur = 5 + Math.random() * 10
          ctx.beginPath()
          ctx.arc(wrappedX, wrappedY, star.radius, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
      
      // Draw clouds (mid-distance layer) with medium parallax
      for (const cloud of cloudsPositionsRef.current) {
        // Apply parallax effect - mid-distance objects move at medium speed
        const parallaxFactor = 0.4 // Clouds move at 40% of mouse movement
        const x = cloud.x + parallaxOffsetRef.current.x * parallaxFactor
        const y = cloud.y + parallaxOffsetRef.current.y * parallaxFactor
        
        // Draw cloud as a cluster of circles
        for (const part of cloud.parts) {
          ctx.beginPath()
          ctx.arc(x + part.dx, y + part.dy, part.radius, 0, Math.PI * 2)
          ctx.fillStyle = settings.cloudColor
          ctx.fill()
        }
      }
      
      // Draw distant mountains (mid layer) with medium parallax
      ctx.fillStyle = settings.midgroundColor
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)
      
      // Create a jagged mountain silhouette for mid layer with parallax
      const midSegments = 15
      const midSegmentWidth = canvas.width / midSegments
      const midParallaxFactor = 0.5 // Mid mountains move at 50% of mouse movement
      
      for (let i = 0; i <= midSegments; i++) {
        const baseX = i * midSegmentWidth
        // Apply horizontal parallax to x position
        const x = baseX + parallaxOffsetRef.current.x * midParallaxFactor
        
        const heightFactor = Math.sin((i / midSegments) * Math.PI * 1.5) * 0.5 + 0.3
        // Apply vertical parallax to mountain height
        const parallaxHeight = heightFactor * canvas.height * 0.4 + parallaxOffsetRef.current.y * midParallaxFactor * 0.5
        const y = canvas.height - parallaxHeight
        
        ctx.lineTo(x, y)
      }
      
      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Draw grid (mid layer) with perspective and parallax effect
      ctx.lineWidth = 1

      // Horizontal lines with perspective effect and parallax
      for (let y = 0; y < canvas.height; y += 40) {
        const opacity = 1 - (y / canvas.height) * 0.7 // Lines fade with distance
        ctx.strokeStyle = settings.gridColor.replace(')', `, ${opacity})`).replace('rgba', 'rgba')
        
        // Apply parallax to grid - stronger effect for closer lines (at bottom)
        const parallaxFactor = 0.3 + (y / canvas.height) * 0.4 // 0.3 to 0.7 based on y position
        const yOffset = y + parallaxOffsetRef.current.y * parallaxFactor
        
        ctx.beginPath()
        ctx.moveTo(0, yOffset)
        ctx.lineTo(canvas.width, yOffset)
        ctx.stroke()
      }

      // Vertical lines with perspective effect and parallax
      for (let x = 0; x < canvas.width; x += 40) {
        const opacity = 0.8 - Math.abs((x / canvas.width) - 0.5) * 0.6 // Center lines more visible
        ctx.strokeStyle = settings.gridColor.replace(')', `, ${opacity})`).replace('rgba', 'rgba')
        
        // Apply parallax to grid - stronger effect for lines away from center
        const distanceFromCenter = Math.abs((x / canvas.width) - 0.5)
        const parallaxFactor = 0.4 + distanceFromCenter * 0.4 // 0.4 to 0.8 based on distance from center
        const xOffset = x + parallaxOffsetRef.current.x * parallaxFactor
        
        ctx.beginPath()
        ctx.moveTo(xOffset, 0)
        ctx.lineTo(xOffset, canvas.height)
        ctx.stroke()
      }

      // Draw foreground mountains (front layer) with strong parallax
      ctx.fillStyle = settings.foregroundColor
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)

      // Create a jagged mountain silhouette for front layer with parallax
      const segments = 10
      const segmentWidth = canvas.width / segments
      const foregroundParallaxFactor = 0.8 // Foreground moves at 80% of mouse movement
      
      for (let i = 0; i <= segments; i++) {
        const baseX = i * segmentWidth
        // Apply horizontal parallax to x position
        const x = baseX + parallaxOffsetRef.current.x * foregroundParallaxFactor
        
        const heightFactor = Math.sin((i / segments) * Math.PI) * 0.5 + 0.5
        // Apply vertical parallax to mountain height
        const parallaxHeight = heightFactor * canvas.height * 0.3 + parallaxOffsetRef.current.y * foregroundParallaxFactor * 0.5
        const y = canvas.height - parallaxHeight
        
        ctx.lineTo(x, y)
      }

      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()
    }

    // Draw a single fruit - maintaining the neon glow effect
    const drawFruit = (fruit: Fruit) => {
      const { x, y, radius, rotation, type } = fruit
      
      // Check if mouse is hovering over fruit
      const dx = mousePositionRef.current.x - x
      const dy = mousePositionRef.current.y - y
      const distSquared = dx * dx + dy * dy
      const isHovered = distSquared <= radius * radius * 1.5
      
      // Draw fruit glow - intensity based on level
      ctx.save()
      ctx.shadowColor = fruitColors[type]
      ctx.shadowBlur = isHovered ? settings.glowIntensity * 1.5 : settings.glowIntensity
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = fruitColors[type]
      ctx.fill()
      ctx.restore()

      // Draw fruit base
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Main fruit body
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)

      // Create gradient
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
      gradient.addColorStop(0, type === "orange" ? "#FFAB40" : type === "lemon" ? "#FFF59D" : "#AED581")
      gradient.addColorStop(0.7, fruitColors[type])
      gradient.addColorStop(1, type === "orange" ? "#E65100" : type === "lemon" ? "#F57F17" : "#33691E")

      ctx.fillStyle = gradient
      ctx.fill()

      // Neon outline
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.strokeStyle = isHovered ? `${fruitColors[type]}FF` : `${fruitColors[type]}AA`
      ctx.lineWidth = isHovered ? 5 : 3
      ctx.stroke()
      
      // Add a "SLICE!" indicator when hovered
      if (isHovered) {
        ctx.fillStyle = "#FFFFFF"
        ctx.font = `bold ${Math.floor(radius/3)}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("SLICE!", 0, 0)
      }

      ctx.restore()
    }

    // Draw a sliced fruit - simplified but keeping the visual effect
    const drawSlicedFruit = (sliced: SlicedFruit) => {
      const { x, y, radius, rotation, type, pieces, timeLeft } = sliced
      
      // Draw pieces
      pieces.forEach((piece, index) => {
        ctx.save()
        
        // Calculate position based on timeLeft - faster animation at higher levels
        const progress = (30 - timeLeft) / 30
        const pieceX = x + piece.dx * progress * 10 * settings.velocityMultiplier
        const pieceY = y + piece.dy * progress * 10 * settings.velocityMultiplier + 
                       progress * progress * 20 * settings.velocityMultiplier
        
        ctx.translate(pieceX, pieceY)
        ctx.rotate(rotation + index * Math.PI/2)
        
        // Draw a quarter circle for each piece
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, radius, index * Math.PI/2, (index + 1) * Math.PI/2)
        ctx.closePath()
        
        // Use the same gradient as the fruit
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
        gradient.addColorStop(0, type === "orange" ? "#FFAB40" : type === "lemon" ? "#FFF59D" : "#AED581")
        gradient.addColorStop(0.7, fruitColors[type])
        gradient.addColorStop(1, type === "orange" ? "#E65100" : type === "lemon" ? "#F57F17" : "#33691E")
        
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Neon outline with intensity based on level
        ctx.strokeStyle = `${fruitColors[type]}AA`
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.restore()
      })
      
      // Draw "SLICED!" text
      const opacity = timeLeft / 30
      
      ctx.save()
      ctx.font = `bold ${Math.floor(radius/2)}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.shadowColor = settings.primaryColor
      ctx.shadowBlur = settings.glowIntensity
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText("SLICED!", x, y)
      ctx.restore()
    }
    
    // Draw floating score text
    const drawFloatingScore = (floatingScore: FloatingScore) => {
      const { x, y, value, timeLeft, color } = floatingScore
      const opacity = timeLeft / 60
      
      ctx.save()
      ctx.font = "bold 24px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.shadowColor = color
      ctx.shadowBlur = settings.glowIntensity
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText(`+${value}`, x, y)
      ctx.restore()
    }

    // Handle mouse movement for slicing and parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const newMousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // Calculate parallax offset based on mouse position
      // Mouse in center = no offset, mouse at edges = maximum offset
      const parallaxStrength = 20 // Maximum pixel offset
      parallaxOffsetRef.current = {
        x: ((newMousePosition.x / canvas.width) - 0.5) * parallaxStrength,
        y: ((newMousePosition.y / canvas.height) - 0.5) * parallaxStrength
      }
      
      mousePositionRef.current = newMousePosition
      
      // Check for fruit slicing
      for (let i = 0; i < fruitsRef.current.length; i++) {
        const fruit = fruitsRef.current[i]
        const dx = mousePositionRef.current.x - fruit.x
        const dy = mousePositionRef.current.y - fruit.y
        const distSquared = dx * dx + dy * dy
        
        if (distSquared <= fruit.radius * fruit.radius * 1.5) {
          // Create sliced fruit with 4 pieces
          const pieces = Array.from({ length: 4 }, (_, i) => ({
            dx: Math.cos(i * Math.PI/2) * 2 * settings.velocityMultiplier,
            dy: Math.sin(i * Math.PI/2) * 2 * settings.velocityMultiplier - 1 // Add some upward velocity
          }))
          
          slicedFruitsRef.current.push({
            id: fruit.id,
            x: fruit.x,
            y: fruit.y,
            type: fruit.type,
            radius: fruit.radius,
            rotation: fruit.rotation,
            timeLeft: 30,
            pieces
          })
          
          // Remove fruit
          fruitsRef.current = fruitsRef.current.filter(f => f.id !== fruit.id)
          
          // Add score - points increase with level
          setScore(prev => prev + settings.pointValue)
          
          // Add floating score
          floatingScoresRef.current.push({
            id: idCounterRef.current++,
            x: fruit.x,
            y: fruit.y - fruit.radius,
            value: settings.pointValue,
            timeLeft: 60,
            color: fruitColors[fruit.type]
          })
          
          break // Only slice one fruit per move
        }
      }
    }
    
    canvas.addEventListener("mousemove", handleMouseMove)
    
    // Touch support for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        mousePositionRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        }
      }
    }
    
    canvas.addEventListener("touchmove", handleTouchMove)
    
    // Spawn fruits periodically - interval based on level
    const fruitInterval = setInterval(() => {
      if (fruitsRef.current.length < settings.maxFruits) {
        spawnFruits()
      }
    }, settings.fruitSpawnInterval)

    // Game loop - simplified
    const updateGame = () => {
      // Clear and draw background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground()

      // Check if we need to spawn fruits immediately
      if (fruitsRef.current.length === 0 && Date.now() - lastFruitSpawnTime > 500) {
        spawnFruits()
      }

      // Update and draw fruits
      const updatedFruits: Fruit[] = []

      for (const fruit of fruitsRef.current) {
        // Apply gravity - adjusted by level
        fruit.velocityY += settings.gravityFactor
        
        // Cap velocities to prevent extreme values
        fruit.velocityX = capVelocity(fruit.velocityX, 2 * settings.velocityMultiplier)
        fruit.velocityY = capVelocity(fruit.velocityY, 4 * settings.velocityMultiplier)
        
        // Update position
        fruit.x += fruit.velocityX
        fruit.y += fruit.velocityY
        
        // Update rotation
        fruit.rotation += fruit.rotationSpeed
        
        // Simple wall collision
        if (fruit.x - fruit.radius < 0) {
          fruit.x = fruit.radius
          fruit.velocityX = Math.abs(fruit.velocityX) * 0.9
        } else if (fruit.x + fruit.radius > canvas.width) {
          fruit.x = canvas.width - fruit.radius
          fruit.velocityX = -Math.abs(fruit.velocityX) * 0.9
        }
        
        // Remove if below screen
        if (fruit.y - fruit.radius > canvas.height) {
          continue
        }
        
        // Keep fruit
        updatedFruits.push(fruit)
        
        // Draw fruit
        drawFruit(fruit)
      }
      
      // Update fruits ref
      fruitsRef.current = updatedFruits
      
      // Update and draw sliced fruits
      const updatedSlicedFruits: SlicedFruit[] = []
      
      for (const sliced of slicedFruitsRef.current) {
        if (sliced.timeLeft <= 0) continue
        
        // Update timeLeft - animations run faster at higher levels
        sliced.timeLeft -= 1 * (1 + (level * 0.1))
        
        // Draw sliced fruit
        drawSlicedFruit(sliced)
        
        // Keep slice
        updatedSlicedFruits.push(sliced)
      }
      
      slicedFruitsRef.current = updatedSlicedFruits
      
      // Update and draw floating scores
      const updatedFloatingScores: FloatingScore[] = []
      
      for (const score of floatingScoresRef.current) {
        if (score.timeLeft <= 0) continue
        
        // Update position and timeLeft - faster at higher levels
        score.y -= 1 * settings.velocityMultiplier
        score.timeLeft -= 1 * (1 + (level * 0.1))
        
        // Draw floating score
        drawFloatingScore(score)
        
        // Keep score
        updatedFloatingScores.push(score)
      }
      
      floatingScoresRef.current = updatedFloatingScores
      
      // Draw score
      ctx.font = "bold 32px monospace"
      ctx.fillStyle = "#FFFFFF"
      ctx.shadowColor = settings.primaryColor
      ctx.shadowBlur = settings.glowIntensity
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText(`LEVEL: ${level}   SCORE: ${score}`, 20, 20)

      // Continue animation
      animationRef.current = requestAnimationFrame(updateGame)
    }

    // Start game loop
    animationRef.current = requestAnimationFrame(updateGame)

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      clearInterval(fruitInterval)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      
      // Reset parallax initialization when component unmounts
      parallaxInitializedRef.current = false
    }
  }, [gameState, score, level])

  // Handle click to start game selection
  const handleStartSelection = () => {
    setGameState("level_select")
  }
  
  // Handle level selection and game start
  const handleSelectLevel = (selectedLevel: number) => {
    setLevel(selectedLevel)
    setGameState("playing")
    setScore(0)
    fruitsRef.current = []
    slicedFruitsRef.current = []
    floatingScoresRef.current = []
    idCounterRef.current = 0
  }

  // CRT screen effect for text
  const CRTText = ({ children, className = "", fontSize = "text-4xl" }: { 
    children: React.ReactNode; 
    className?: string; 
    fontSize?: string 
  }) => {
    return (
      <div className={`relative ${fontSize} font-bold ${className}`}>
        <div className="absolute inset-0 text-cyan-400 blur-[1px] animate-pulse opacity-70">{children}</div>
        <div className={`relative z-10 neon-text ${glitchText ? "animate-glitch" : ""}`}>{children}</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-purple-900 font-mono">
      {/* Game canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* UI Overlay - Make sure it doesn't block pointer events when game is playing */}
      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${gameState === "playing" ? "pointer-events-none" : ""}`}>
        {gameState === "title" && (
          <div className="flex flex-col items-center justify-center space-y-8 pointer-events-auto">
            <div className="text-center transform-3d">
              <CRTText className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-2">
                NEON FRUIT
              </CRTText>
              <CRTText className="text-5xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500">
                NINJA
              </CRTText>
            </div>

            <div className="relative transform-3d">
              <button
                onClick={handleStartSelection}
                className="relative px-10 py-4 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg overflow-hidden group depth-shadow"
              >
                <span className="relative z-10">START GAME</span>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            </div>

            <div className="text-center max-w-md px-4 bg-pulse">
              <CRTText fontSize="text-lg" className="text-cyan-300">
                Slice fruits in a neon dimension!
              </CRTText>
              <CRTText fontSize="text-sm" className="text-pink-300 mt-2">
                Just hover over fruits to slice them and score points
              </CRTText>
            </div>
          </div>
        )}
        
        {gameState === "level_select" && (
          <div className="flex flex-col items-center justify-center space-y-8 pointer-events-auto bg-purple-900 bg-opacity-80 p-8 rounded-xl shadow-xl depth-shadow transform-3d">
            <CRTText className="text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
              SELECT DIFFICULTY
            </CRTText>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleSelectLevel(1)}
                className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-500 hover:to-blue-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center depth-shadow transform-3d hover:scale-105"
              >
                <span className="text-2xl mb-2 neon-text">LEVEL 1</span>
                <span className="text-cyan-300 text-sm mb-1">CHILL MODE</span>
                <span className="text-white text-xs opacity-80">Normal Speed</span>
              </button>
              
              <button
                onClick={() => handleSelectLevel(2)}
                className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center depth-shadow transform-3d hover:scale-105"
              >
                <span className="text-2xl mb-2 neon-text">LEVEL 2</span>
                <span className="text-pink-300 text-sm mb-1">HYPER MODE</span>
                <span className="text-white text-xs opacity-80">50% Faster</span>
              </button>
              
              <button
                onClick={() => handleSelectLevel(3)}
                className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-red-600 to-yellow-600 rounded-lg hover:from-red-500 hover:to-yellow-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center depth-shadow transform-3d hover:scale-105"
              >
                <span className="text-2xl mb-2 neon-text">LEVEL 3</span>
                <span className="text-yellow-300 text-sm mb-1">EXTREME MODE</span>
                <span className="text-white text-xs opacity-80">120% Faster</span>
              </button>
            </div>
            
            <button
              onClick={() => setGameState("title")}
              className="mt-4 px-6 py-2 text-sm font-bold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300 depth-shadow"
            >
              BACK
            </button>
          </div>
        )}
      </div>

      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }
        
        .animate-glitch {
          animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        
        /* Add 3D rotation effect on mouse move for depth */
        .transform-3d:hover {
          transform: perspective(1000px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg));
        }
      `}</style>
      
      {/* Add script for 3D rotation effect on mouse move */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('mousemove', (e) => {
            const elements = document.querySelectorAll('.transform-3d');
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            elements.forEach(element => {
              const rotateX = (centerY - e.clientY) / 50;
              const rotateY = (e.clientX - centerX) / 50;
              
              element.style.setProperty('--rotate-x', rotateX + 'deg');
              element.style.setProperty('--rotate-y', rotateY + 'deg');
            });
          });
        `
      }} />
    </div>
  )
}
