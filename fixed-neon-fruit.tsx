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
  decompositionStage: number // Add this to track the decomposition progress
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

    // Track mouse position for hover effects
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
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
      const { x, y, radius, rotation, type, sliceAngle, pieces, timeLeft } = sliced
      
      // Calculate decomposition progress (0 to 5 layers)
      // More gradual decomposition for the longer timeLeft value
      const decompositionLayers = Math.min(5, Math.floor((120 - timeLeft) / 24));
      
      // Draw each half
      pieces.forEach((piece, index) => {
        ctx.save()
        
        // Position the half with movement based on time and apply gravity effect
        const elapsedTime = (120 - timeLeft) / 20; // Adjusted for longer timeLeft
        const gravityEffect = 0.5 * 0.15 * Math.pow(elapsedTime, 2); // Physics formula for gravity
        
        ctx.translate(
          x + piece.dx * elapsedTime, 
          y + piece.dy * elapsedTime + gravityEffect
        )
        
        // Rotate the half with slight additional rotation over time for more natural movement
        const additionalRotation = piece.dy * elapsedTime * 0.02;
        ctx.rotate(piece.rotation + additionalRotation);
        
        // Draw a half of the fruit
        ctx.beginPath()
        ctx.moveTo(0, 0)
        const startAngle = index === 0 ? 0 : Math.PI
        const endAngle = index === 0 ? Math.PI : Math.PI * 2
        ctx.arc(0, 0, radius, startAngle, endAngle)
        ctx.closePath()
        
        // Create layers for the fruit (from outer to inner)
        const layerCount = 5; // 5 layers total
        const layerWidth = radius / layerCount;
        
        // Draw each layer from outer to inner
        for (let layer = 0; layer < layerCount; layer++) {
          const layerRadius = radius - (layer * layerWidth);
          
          // Skip if this layer is too small
          if (layerRadius <= 0) continue;
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, layerRadius, startAngle, endAngle);
          ctx.closePath();
          
          // Determine if this layer should be decomposed (green)
          const isDecomposed = layer < decompositionLayers;
          
          // Create gradient for this layer
          const gradient = ctx.createRadialGradient(-layerRadius * 0.3, -layerRadius * 0.3, 0, 0, 0, layerRadius);
          
          if (isDecomposed) {
            // More vibrant green decomposition colors with pulsing effect
            const pulseIntensity = 0.2 * Math.sin((120 - timeLeft) * 0.1) + 0.8; // Pulsing effect between 0.6-1.0
            
            // Different green shades for different layers to emphasize decomposition
            if (layer === 0) {
              // Outermost layer - brightest green
              gradient.addColorStop(0, "#CAFFCA");
              gradient.addColorStop(0.7, `rgba(102, 204, 102, ${pulseIntensity})`);
              gradient.addColorStop(1, "#338833");
            } else if (layer === 1) {
              // Second layer - medium green
              gradient.addColorStop(0, "#AAFFAA");
              gradient.addColorStop(0.7, `rgba(85, 187, 85, ${pulseIntensity})`);
              gradient.addColorStop(1, "#227722");
            } else {
              // Inner layers - darker green
              gradient.addColorStop(0, "#88EE88");
              gradient.addColorStop(0.7, `rgba(68, 170, 68, ${pulseIntensity})`);
              gradient.addColorStop(1, "#116611");
            }
          } else {
            // Normal fruit colors
            gradient.addColorStop(0, type === "orange" ? "#FFAB40" : type === "lemon" ? "#FFF59D" : "#AED581");
            gradient.addColorStop(0.7, fruitColors[type]);
            gradient.addColorStop(1, type === "orange" ? "#E65100" : type === "lemon" ? "#F57F17" : "#33691E");
          }
          
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Neon outline for the outer layer only
          if (layer === 0) {
            ctx.strokeStyle = isDecomposed ? 
              `rgba(102, 204, 102, ${0.7 + 0.3 * Math.sin((120 - timeLeft) * 0.1)})` : // Glowing green outline
              `${fruitColors[type]}AA`;
            ctx.lineWidth = isDecomposed ? 3 : 2; // Thicker outline for decomposed state
            ctx.stroke();
          }
        }
        
        // For decomposing pieces, add a subtle green glow
        if (decompositionLayers > 0) {
          ctx.shadowColor = "#66CC66";
          ctx.shadowBlur = 10 + 5 * Math.sin((120 - timeLeft) * 0.1); // Pulsing glow
          ctx.beginPath();
          ctx.arc(0, 0, radius, startAngle, endAngle);
          ctx.strokeStyle = "rgba(102, 204, 102, 0.3)";
          ctx.lineWidth = 5;
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      // Only show text at the beginning of the animation
      if (timeLeft > 100) { // Adjusted for longer timeLeft
        ctx.save();
        ctx.translate(x, y);
        
        // Make text fade out
        const opacity = (timeLeft - 100) / 20;
        
        // Draw text with glow effect
        ctx.font = `bold ${Math.floor(radius/2)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Text glow
        ctx.shadowColor = "#FF00FF";
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText("SLICED!", 0, 0);
        
        ctx.restore();
      }
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

    // Draw background
    const drawBackground = () => {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#4A00E0") // Deep purple
      gradient.addColorStop(1, "#2F80ED") // Bright blue

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "rgba(255, 0, 255, 0.2)"
      ctx.lineWidth = 1

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical lines
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Draw mountains
      ctx.fillStyle = "rgba(156, 39, 176, 0.7)"
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)

      // Create a jagged mountain silhouette
      const segments = 10
      const segmentWidth = canvas.width / segments

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth
        const heightFactor = Math.sin((i / segments) * Math.PI) * 0.5 + 0.5
        const y = canvas.height - heightFactor * canvas.height * 0.3
        ctx.lineTo(x, y)
      }

      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()
    }

    // Update the handleCanvasClick function to make fruits split into exactly two halves
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
          
          // Create exactly two pieces (halves) with deterministic directions
          // Each half moves perpendicular to the slice angle
          const pieces = [
            // First half
            {
              dx: Math.cos(sliceAngle + Math.PI/2) * 1.5, // Perpendicular to slice angle
              dy: Math.sin(sliceAngle + Math.PI/2) * 1.5 - 1, // Add slight upward velocity
              rotation: sliceAngle // Aligned with slice direction
            },
            // Second half
            {
              dx: Math.cos(sliceAngle - Math.PI/2) * 1.5, // Opposite perpendicular
              dy: Math.sin(sliceAngle - Math.PI/2) * 1.5 - 1, // Add slight upward velocity
              rotation: sliceAngle + Math.PI // Opposite alignment
            }
          ]
          
          // Add to sliced fruits with decompositionStage
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
              timeLeft: 120, // Double the animation time to allow for slower decomposition
              decompositionStage: 0 // Start at stage 0 (no decomposition)
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
              // Apply more gravity to pieces so they fall more naturally
              dy: piece.dy + 0.15, // Increased gravity effect
              dx: piece.dx * 0.98 // Slow down horizontal movement slightly
            }))
          }))
          // Only remove sliced fruits if they're off-screen (below the canvas)
          .filter(sliced => {
            // Keep fruits that still have time left
            if (sliced.timeLeft > 0) return true;
            
            // Check if all pieces are below the screen
            const allPiecesBelowScreen = sliced.pieces.every(piece => {
              const posY = sliced.y + piece.dy * (120 - sliced.timeLeft) / 20 + 
                           0.5 * 0.15 * Math.pow((120 - sliced.timeLeft) / 20, 2);
              return posY > canvas.height + sliced.radius;
            });
            
            return !allPiecesBelowScreen;
          })
          
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
        <div className={`relative z-10 ${glitchText ? "animate-glitch" : ""}`}>{children}</div>
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
            <div className="text-center">
              <CRTText className="text-6xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-2">
                NEON FRUIT
              </CRTText>
              <CRTText className="text-5xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500">
                NINJA
              </CRTText>
            </div>

            <div className="relative">
              <button
                onClick={handleStartGame}
                className="relative px-10 py-4 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg overflow-hidden group"
              >
                <span className="relative z-10">START GAME</span>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            </div>

            <div className="text-center max-w-md px-4">
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
      `}</style>
    </div>
  )
}

