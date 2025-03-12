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
  hovered: boolean // Add hovered state to track hover status
}

// Add type for sliced fruit
type SlicedFruit = {
  id: number
  x: number
  y: number
  type: "orange" | "lemon" | "lime"
  radius: number
  rotation: number
  sliceAngle: number
  pieces: { dx: number; dy: number; rotation: number }[]
  timeLeft: number
}

// Add type for floating score text
type FloatingScore = {
  id: number
  x: number
  y: number
  value: number
  timeLeft: number
  color: string
}

export default function FixedNeonFruit() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<"title" | "playing">("title")
  const [glitchText, setGlitchText] = useState(false)
  
  // Add state for sliced fruits
  const [slicedFruits, setSlicedFruits] = useState<SlicedFruit[]>([])
  
  // Add state for floating score texts
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([])

  // Refs for animation and game state
  const animationRef = useRef<number | undefined>(undefined)
  const fruitsRef = useRef<Fruit[]>([])
  const fruitIdCounterRef = useRef(0)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const scoreIdCounterRef = useRef(0)
  
  // Add refs for parallax effect
  const parallaxOffsetRef = useRef({ x: 0, y: 0 })
  const starsPositionsRef = useRef<Array<{x: number, y: number, radius: number, opacity: number, glow: boolean}>>([])
  const nebulasPositionsRef = useRef<Array<{x: number, y: number, radius: number, hue: number, parts: Array<{dx: number, dy: number, radius: number}>}>>([])
  const parallaxInitializedRef = useRef(false)

  // Fruit colors
  const fruitColors = {
    orange: "#FF6D00",
    lemon: "#FFEA00",
    lime: "#76FF03",
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

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)
    
    // Initialize parallax elements if not already done
    if (!parallaxInitializedRef.current) {
      // Initialize stars positions
      starsPositionsRef.current = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        glow: Math.random() > 0.7
      }))
      
      // Initialize nebula positions
      nebulasPositionsRef.current = Array.from({ length: 7 }, () => {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height * 0.5
        const radius = Math.random() * 70 + 50
        const hue = Math.floor(Math.random() * 60) + 240 // Blue to purple range
        
        // Create nebula parts
        const parts = Array.from({ length: 5 }, () => ({
          dx: (Math.random() - 0.5) * radius,
          dy: (Math.random() - 0.5) * radius * 0.5,
          radius: radius * (0.5 + Math.random() * 0.5)
        }))
        
        return { x, y, radius, hue, parts }
      })
      
      parallaxInitializedRef.current = true
    }

    // Track mouse position for hover effects and parallax
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
    }
    
    canvas.addEventListener("mousemove", handleMouseMove)

    // Create a new fruit
    const createFruit = () => {
      const types = ["orange", "lemon", "lime"] as const
      const type = types[Math.floor(Math.random() * types.length)]
      // Make fruits larger (50-90 instead of 40-70)
      const radius = Math.random() * 40 + 50
      const x = Math.random() * (window.innerWidth - radius * 2) + radius
      const y = -radius * 2 // Start above the screen

      const newFruit: Fruit = {
        id: fruitIdCounterRef.current++,
        type,
        x,
        y,
        radius,
        // Reduce velocity for slower movement
        velocityX: (Math.random() - 0.5) * 1.5, // Reduced from 3
        velocityY: Math.random() * 1 + 0.5, // Reduced from 2+1
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03, // Reduced from 0.05
        hovered: false
      }

      fruitsRef.current.push(newFruit)
    }

    // Spawn fruits periodically - slower spawn rate
    const fruitInterval = setInterval(() => {
      if (fruitsRef.current.length < 8) { // Reduced from 10
        createFruit()
      }
    }, 2500) // Increased from 2000

    // Draw a single fruit
    const drawFruit = (fruit: Fruit) => {
      const { x, y, radius, rotation, type, hovered } = fruit
      
      // Draw fruit glow with enhanced effect when hovered
      ctx.save()
      ctx.shadowColor = fruitColors[type]
      ctx.shadowBlur = hovered ? 30 : 20
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

      // Highlight
      ctx.beginPath()
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.4, 0, Math.PI * 2)
      const highlightGradient = ctx.createRadialGradient(
        -radius * 0.3,
        -radius * 0.3,
        0,
        -radius * 0.3,
        -radius * 0.3,
        radius * 0.4,
      )
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = highlightGradient
      ctx.fill()

      // Neon outline with enhanced effect when hovered
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.strokeStyle = hovered ? `${fruitColors[type]}FF` : `${fruitColors[type]}AA`
      ctx.lineWidth = hovered ? 5 : 3
      ctx.stroke()
      
      // Add a "slice me" indicator when hovered
      if (hovered) {
        ctx.fillStyle = "#FFFFFF"
        ctx.font = `bold ${Math.floor(radius/3)}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("SLICE!", 0, 0)
      }

      ctx.restore()
    }

    // Draw a sliced fruit
    const drawSlicedFruit = (sliced: SlicedFruit) => {
      const { x, y, radius, rotation, type, sliceAngle, pieces } = sliced
      
      // Draw each piece
      pieces.forEach((piece, index) => {
        ctx.save()
        ctx.translate(
          x + piece.dx * (30 - sliced.timeLeft), 
          y + piece.dy * (30 - sliced.timeLeft)
        )
        ctx.rotate(rotation + piece.rotation)
        
        // Draw a quarter of the fruit
        ctx.beginPath()
        ctx.moveTo(0, 0)
        const startAngle = (index * Math.PI / 2) + sliceAngle
        const endAngle = startAngle + Math.PI / 2
        ctx.arc(0, 0, radius, startAngle, endAngle)
        ctx.closePath()
        
        // Create gradient
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
        gradient.addColorStop(0, type === "orange" ? "#FFAB40" : type === "lemon" ? "#FFF59D" : "#AED581")
        gradient.addColorStop(0.7, fruitColors[type])
        gradient.addColorStop(1, type === "orange" ? "#E65100" : type === "lemon" ? "#F57F17" : "#33691E")
        
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Neon outline
        ctx.strokeStyle = `${fruitColors[type]}AA`
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.restore()
      })
      
      // Draw "SLICED!" text at the position where the fruit was sliced
      ctx.save()
      ctx.translate(x, y)
      
      // Make text fade out as the animation progresses
      const opacity = sliced.timeLeft / 30
      
      // Draw text with glow effect
      ctx.font = `bold ${Math.floor(radius/2)}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      // Text glow
      ctx.shadowColor = "#FF00FF"
      ctx.shadowBlur = 15
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText("SLICED!", 0, 0)
      
      ctx.restore()
    }
    
    // Draw floating score text
    const drawFloatingScore = (floatingScore: FloatingScore) => {
      const { x, y, value, timeLeft, color } = floatingScore
      
      // Calculate opacity based on remaining time
      const opacity = timeLeft / 60
      
      ctx.save()
      
      // Text settings
      ctx.font = "bold 24px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      // Text glow
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      
      // Draw text with fade out
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText(`+${value}`, x, y)
      
      ctx.restore()
    }

    // Draw background with parallax effects
    const drawBackground = () => {
      // Create deep space gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0D0221") // Deep space purple
      gradient.addColorStop(0.5, "#3D0E61") // Mid purple
      gradient.addColorStop(1, "#4A00E0") // Bright purple

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
          ctx.shadowColor = "rgba(255, 255, 255, 0.8)"
          ctx.shadowBlur = 5 + Math.random() * 10
          ctx.beginPath()
          ctx.arc(wrappedX, wrappedY, star.radius, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
      
      // Draw nebula clouds (distant layer) with subtle parallax
      for (const nebula of nebulasPositionsRef.current) {
        // Apply parallax effect - nebulas move at medium speed
        const parallaxFactor = 0.3 // Nebulas move at 30% of mouse movement
        const x = nebula.x + parallaxOffsetRef.current.x * parallaxFactor
        const y = nebula.y + parallaxOffsetRef.current.y * parallaxFactor
        
        // Draw nebula as a cluster of circles
        for (const part of nebula.parts) {
          // Create a radial gradient for the nebula
          const nebulaGradient = ctx.createRadialGradient(
            x + part.dx, y + part.dy, 0,
            x + part.dx, y + part.dy, part.radius
          )
          
          nebulaGradient.addColorStop(0, `hsla(${nebula.hue}, 100%, 70%, 0.3)`)
          nebulaGradient.addColorStop(1, `hsla(${nebula.hue}, 100%, 50%, 0)`)
          
          ctx.beginPath()
          ctx.arc(x + part.dx, y + part.dy, part.radius, 0, Math.PI * 2)
          ctx.fillStyle = nebulaGradient
          ctx.fill()
        }
      }
      
      // Draw distant mountains (mid layer) with medium parallax
      ctx.fillStyle = "rgba(124, 58, 237, 0.5)" // Purple midground
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
        ctx.strokeStyle = `rgba(255, 0, 255, ${opacity * 0.2})`
        
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
        ctx.strokeStyle = `rgba(255, 0, 255, ${opacity * 0.2})`
        
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
      ctx.fillStyle = "rgba(76, 29, 149, 0.8)" // Deep purple foreground
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

    // Add click and touch event handlers
    const handleCanvasClick = (e: MouseEvent | TouchEvent) => {
      let clickX: number, clickY: number
      const rect = canvas.getBoundingClientRect()
      
      // Handle both mouse and touch events
      if ('touches' in e) {
        // Touch event
        clickX = e.touches[0].clientX - rect.left
        clickY = e.touches[0].clientY - rect.top
      } else {
        // Mouse event
        clickX = e.clientX - rect.left
        clickY = e.clientY - rect.top
      }
      
      // Check if click intersects with any fruit - with increased hit area
      for (let i = 0; i < fruitsRef.current.length; i++) {
        const fruit = fruitsRef.current[i]
        const dx = clickX - fruit.x
        const dy = clickY - fruit.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Increase hit area by 20% to make clicking easier
        if (distance <= fruit.radius * 1.2) {
          // Calculate slice angle based on click position
          const sliceAngle = Math.atan2(dy, dx)
          
          // Create sliced fruit animation
          const pieces = Array.from({ length: 4 }, () => ({
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5 - 2, // Add upward velocity
            rotation: Math.random() * Math.PI * 2
          }))
          
          // Add to sliced fruits
          setSlicedFruits(prev => [
            ...prev,
            {
              id: fruit.id,
              x: fruit.x,
              y: fruit.y,
              type: fruit.type,
              radius: fruit.radius,
              rotation: fruit.rotation,
              sliceAngle,
              pieces,
              timeLeft: 30 // Animation frames
            }
          ])
          
          // Remove fruit from active fruits
          fruitsRef.current = fruitsRef.current.filter(f => f.id !== fruit.id)
          
          // Increase score
          const pointsEarned = 100
          setScore(prev => prev + pointsEarned)
          
          // Add floating score text
          setFloatingScores(prev => [
            ...prev,
            {
              id: scoreIdCounterRef.current++,
              x: fruit.x,
              y: fruit.y - fruit.radius,
              value: pointsEarned,
              timeLeft: 60, // Animation frames
              color: fruitColors[fruit.type]
            }
          ])
          
          // Only slice one fruit per click
          break
        }
      }
    }
    
    // Add event listeners for both mouse and touch
    canvas.addEventListener("click", handleCanvasClick)
    canvas.addEventListener("touchstart", handleCanvasClick)

    // Update game state
    const updateGame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      drawBackground()

      // Update fruits
      const updatedFruits: Fruit[] = []

      for (const fruit of fruitsRef.current) {
        // Update position
        const newX = fruit.x + fruit.velocityX
        const newY = fruit.y + fruit.velocityY

        // Update rotation
        const newRotation = fruit.rotation + fruit.rotationSpeed

        // Check for hover state
        const dx = mousePositionRef.current.x - newX
        const dy = mousePositionRef.current.y - newY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const isHovered = distance <= fruit.radius * 1.2 // Increase hover area by 20%

        // Check for collisions with other fruits
        for (const otherFruit of fruitsRef.current) {
          if (fruit.id === otherFruit.id) continue

          const dx = newX - otherFruit.x
          const dy = newY - otherFruit.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < fruit.radius + otherFruit.radius) {
            // Simple collision response
            fruit.velocityX = -fruit.velocityX * 0.8
            fruit.velocityY = -fruit.velocityY * 0.8

            // Increase score on collision
            setScore((prev) => prev + 10)
            break
          }
        }

        // Check for wall collisions
        if (newX - fruit.radius < 0 || newX + fruit.radius > canvas.width) {
          fruit.velocityX = -fruit.velocityX * 0.8
        }

        // Check if fruit is below screen
        if (newY - fruit.radius > canvas.height) {
          // Skip this fruit (remove it)
          continue
        }

        // Apply gravity - reduced for slower falling
        const gravity = 0.1 // Reduced from 0.2

        // Update fruit
        const updatedFruit = {
          ...fruit,
          x: newX,
          y: newY,
          velocityY: fruit.velocityY + gravity,
          rotation: newRotation,
          hovered: isHovered
        }

        updatedFruits.push(updatedFruit)
      }

      // Update fruits ref
      fruitsRef.current = updatedFruits

      // Draw all fruits
      for (const fruit of fruitsRef.current) {
        drawFruit(fruit)
      }
      
      // Update and draw sliced fruits
      setSlicedFruits(prev => {
        const updated = prev
          .map(sliced => ({
            ...sliced,
            timeLeft: sliced.timeLeft - 1,
            pieces: sliced.pieces.map(piece => ({
              ...piece,
              dy: piece.dy + 0.1 // Add gravity to pieces
            }))
          }))
          .filter(sliced => sliced.timeLeft > 0)
          
        // Draw all sliced fruits
        updated.forEach(drawSlicedFruit)
        
        return updated
      })
      
      // Update and draw floating score texts
      setFloatingScores(prev => {
        const updated = prev
          .map(floatingScore => ({
            ...floatingScore,
            y: floatingScore.y - 1, // Move upward
            timeLeft: floatingScore.timeLeft - 1
          }))
          .filter(floatingScore => floatingScore.timeLeft > 0)
        
        // Draw all floating scores
        updated.forEach(drawFloatingScore)
        
        return updated
      })

      // Draw score
      ctx.font = "bold 32px monospace"
      ctx.fillStyle = "#FFFFFF"
      ctx.shadowColor = "#FF00FF"
      ctx.shadowBlur = 10
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText(`SCORE: ${score}`, 20, 20)

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
      window.removeEventListener("resize", setCanvasDimensions)
      canvas.removeEventListener("click", handleCanvasClick)
      canvas.removeEventListener("touchstart", handleCanvasClick)
      canvas.removeEventListener("mousemove", handleMouseMove)
      
      // Reset parallax initialization when component unmounts
      parallaxInitializedRef.current = false
    }
  }, [gameState, score])

  // Handle click to start game
  const handleStartGame = () => {
    setGameState("playing")
    setScore(0)
    fruitsRef.current = []
    fruitIdCounterRef.current = 0
    setSlicedFruits([])
    setFloatingScores([])
    scoreIdCounterRef.current = 0
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

      {/* UI Overlay - Make sure it doesn't block clicks when game is playing */}
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
                onClick={handleStartGame}
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
                Click on fruits to slice them and score points
              </CRTText>
            </div>
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

