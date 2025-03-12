"use client"

import { useEffect, useRef, useState } from "react"

// Update the piece type first
type FruitPiece = {
  dx: number;
  dy: number;
  x: number;
  y: number;
  radius: number;
  velocityX?: number;
  velocityY?: number;
};

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
  sliced: boolean
  pieces: FruitPiece[]
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
  pieces: FruitPiece[]
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
  gridColor: string
  mountainColor: string
  pointValue: number
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<"title" | "level_select" | "playing" | "game_over">("title")
  const [level, setLevel] = useState(1)
  const [glitchText, setGlitchText] = useState(false)
  const [missedFruits, setMissedFruits] = useState(0)
  
  // Use refs for better performance with animations
  const fruitsRef = useRef<Fruit[]>([])
  const slicedFruitsRef = useRef<SlicedFruit[]>([])
  const floatingScoresRef = useRef<FloatingScore[]>([])
  const idCounterRef = useRef(0)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)

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
      backgroundColor1: "#4A00E0",
      backgroundColor2: "#2F80ED",
      gridColor: "rgba(255, 0, 255, 0.2)",
      mountainColor: "rgba(156, 39, 176, 0.7)",
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
      backgroundColor1: "#6A00E0",
      backgroundColor2: "#1F60CD",
      gridColor: "rgba(255, 0, 128, 0.3)",
      mountainColor: "rgba(176, 39, 156, 0.8)",
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
      backgroundColor1: "#8A00E0",
      backgroundColor2: "#1F40AD",
      gridColor: "rgba(255, 0, 0, 0.4)",
      mountainColor: "rgba(220, 39, 39, 0.8)",
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

    // Move the setCanvasDimensions function before it's used
    // Define setCanvasDimensions before it's used
    const setCanvasDimensions = () => {
      // Get parent container dimensions exactly
      const parentElement = canvas.parentElement;
      if (!parentElement) return;
      
      // Get exact container dimensions with getBoundingClientRect for precision
      const rect = parentElement.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      // Set canvas dimensions to exactly match container
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      // Ensure canvas completely fills its container with no gaps
      canvas.style.margin = '0';
      canvas.style.padding = '0';
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }

    // Set canvas dimensions
    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Track last time fruits were spawned
    let lastFruitSpawnTime = Date.now()

    // Create a new fruit - simplified
    const createFruit = () => {
      const radius = Math.floor(Math.random() * 40) + 50; // 50-90 range for fruit size
      
      // Make sure fruits spawn fully within the canvas borders
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = -radius; // Start just above the canvas
      
      // Random velocities
      const velocityX = (Math.random() - 0.5) * 10;
      const velocityY = Math.random() * 2 + 8;
      
      // Get random fruit type
      const types = ["orange", "lemon", "lime"] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Create a new fruit
      const fruit = {
        id: idCounterRef.current++,
        x,
        y,
        radius,
        velocityX,
        velocityY,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        sliced: false,
        pieces: [],
        type,
      };
      
      fruitsRef.current.push(fruit);
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

    // Update drawBackground to use zero padding
    const drawBackground = () => {
      // Create gradient background - fill entire canvas
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, settings.backgroundColor1)
      gradient.addColorStop(1, settings.backgroundColor2)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid - draw lines all the way to the edges
      ctx.strokeStyle = settings.gridColor
      ctx.lineWidth = 1

      // Draw horizontal grid lines - from edge to edge
      for (let y = 0; y <= canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw vertical grid lines - from edge to edge
      for (let x = 0; x <= canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Draw mountains filling the entire bottom
      ctx.fillStyle = settings.mountainColor
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)

      // Create a jagged mountain silhouette
      const segments = 10
      const segmentWidth = canvas.width / segments

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth
        const heightFactor = Math.sin((i / segments) * Math.PI) * 0.5 + 0.5
        const y = canvas.height - heightFactor * canvas.height * 0.2
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

    // Draw a sliced fruit - revised to use halves with decomposition and better rotation
    const drawSlicedFruit = (sliced: SlicedFruit) => {
      // Calculate decomposition progress (0 to 5 layers)
      const decompositionLayers = Math.min(5, Math.floor((120 - sliced.timeLeft) / 24));
      
      // Draw each half
      for (let i = 0; i < sliced.pieces.length; i++) {
        const piece = sliced.pieces[i];
        const isFirstHalf = i === 0;
        
        // Update the piece's position based on current dx, dy values
        piece.x = sliced.x + piece.dx;
        piece.y = sliced.y + piece.dy;
        
        // Draw fruit half using the piece's x and y directly
        ctx.save();
        ctx.translate(piece.x, piece.y);
        
        // Calculate proper rotation based on slice angle
        // For first half, rotate 90° to the right of slice angle
        // For second half, rotate 90° to the left of slice angle
        const baseRotation = isFirstHalf ? 
          sliced.rotation - Math.PI/2 : 
          sliced.rotation + Math.PI/2;
          
        // Add some rotation based on velocities
        const additionalRotation = ((piece.velocityX || 0) * 0.01) + ((piece.velocityY || 0) * 0.015);
        ctx.rotate(baseRotation + additionalRotation * sliced.timeLeft * 0.1);
        
        // Draw a half of the fruit
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Draw semicircle with flat side aligned to slice direction
        const startAngle = 0;
        const endAngle = Math.PI;
        ctx.arc(0, 0, piece.radius, startAngle, endAngle);
        ctx.closePath();
        
        // Create layers for the fruit (from outer to inner)
        const layerCount = 5; // 5 layers total
        const layerWidth = piece.radius / layerCount;
        
        // Draw each layer from outer to inner
        for (let layer = 0; layer < layerCount; layer++) {
          const layerRadius = piece.radius - (layer * layerWidth);
          
          // Skip if this layer is too small
          if (layerRadius <= 0) continue;
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, layerRadius, startAngle, endAngle);
          ctx.closePath();
          
          // Determine if this layer should be decomposed (green)
          const isDecomposed = layer < decompositionLayers;
          
          // Fill based on decomposition state
          if (isDecomposed) {
            // Green decomposition with pulsing effect
            const pulseIntensity = 0.2 * Math.sin((120 - sliced.timeLeft) * 0.2) + 0.8;
            
            // Different green shades for different layers
            if (layer === 0) {
              // Outermost layer - brightest green
              ctx.fillStyle = "#CAFFCA";
            } else if (layer === 1) {
              // Second layer - medium green
              ctx.fillStyle = `rgba(102, 204, 102, ${pulseIntensity})`;
            } else {
              // Inner layers - darker green
              ctx.fillStyle = "#227722";
            }
          } else {
            // Normal fruit color
            ctx.fillStyle = fruitColors[sliced.type];
          }
          ctx.fill();
          
          // Add neon glow for the outer layer
          if (layer === 0) {
            ctx.shadowColor = isDecomposed ? "#66CC66" : fruitColors[sliced.type];
            ctx.shadowBlur = settings.glowIntensity;
            ctx.strokeStyle = isDecomposed ? 
              `rgba(102, 204, 102, ${0.7 + 0.3 * Math.sin((120 - sliced.timeLeft) * 0.2)})` : 
              fruitColors[sliced.type];
            ctx.lineWidth = isDecomposed ? 3 : 2;
            ctx.stroke();
          }
        }
        
        // Draw slice edge with green decomposition color for contrast
        ctx.beginPath();
        ctx.moveTo(-piece.radius, 0);
        ctx.lineTo(piece.radius, 0);
        ctx.strokeStyle = decompositionLayers > 0 ? "#4CAF50" : "#FFFFFF";
        ctx.shadowColor = decompositionLayers > 0 ? "#00FF00" : "#FFFFFF";
        ctx.shadowBlur = settings.glowIntensity;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }
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

    // Handle mouse movement for slicing
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // Check for fruit slicing
      for (let i = 0; i < fruitsRef.current.length; i++) {
        const fruit = fruitsRef.current[i]
        const dx = mousePositionRef.current.x - fruit.x
        const dy = mousePositionRef.current.y - fruit.y
        const distSquared = dx * dx + dy * dy
        
        if (distSquared <= fruit.radius * fruit.radius * 1.5) {
          // Calculate slice angle
          const sliceAngle = Math.atan2(dy, dx);
          
          // Calculate perpendicular directions to the slice
          const perpAngle1 = sliceAngle + Math.PI/2;
          const perpAngle2 = sliceAngle - Math.PI/2;
          
          // Apply immediate offset to separate the halves
          const immediateOffset = fruit.radius * 0.3;
          
          // Create the two halves with initial separation
          const pieces = [
            {
              // First half
              dx: Math.cos(perpAngle1) * immediateOffset,
              dy: Math.sin(perpAngle1) * immediateOffset,
              velocityX: Math.cos(perpAngle1) * 2 * settings.velocityMultiplier,
              velocityY: Math.sin(perpAngle1) * 2 * settings.velocityMultiplier - 1,
              x: fruit.x + Math.cos(perpAngle1) * immediateOffset,
              y: fruit.y + Math.sin(perpAngle1) * immediateOffset,
              radius: fruit.radius
            },
            {
              // Second half
              dx: Math.cos(perpAngle2) * immediateOffset,
              dy: Math.sin(perpAngle2) * immediateOffset,
              velocityX: Math.cos(perpAngle2) * 2 * settings.velocityMultiplier,
              velocityY: Math.sin(perpAngle2) * 2 * settings.velocityMultiplier - 1,
              x: fruit.x + Math.cos(perpAngle2) * immediateOffset,
              y: fruit.y + Math.sin(perpAngle2) * immediateOffset,
              radius: fruit.radius
            }
          ];
          
          slicedFruitsRef.current.push({
            id: fruit.id,
            x: fruit.x,
            y: fruit.y,
            type: fruit.type,
            radius: fruit.radius,
            rotation: sliceAngle, // Use slice angle directly
            timeLeft: 120,
            pieces
          });
          
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
      const fruitsToRemove: number[] = []

      for (let i = 0; i < fruitsRef.current.length; i++) {
        const fruit = fruitsRef.current[i]
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
        
        // Update wall collision detection to match new dimensions
        // Simple wall collision with minimal padding
        const wallPadding = 0; // No padding
        if (fruit.x - fruit.radius < wallPadding) {
          fruit.x = fruit.radius + wallPadding;
          fruit.velocityX = Math.abs(fruit.velocityX) * 0.9;
        } else if (fruit.x + fruit.radius > canvas.width - wallPadding) {
          fruit.x = canvas.width - fruit.radius - wallPadding;
          fruit.velocityX = -Math.abs(fruit.velocityX) * 0.9;
        }
        
        // Update off-screen detection to be consistent
        // A fruit is off-screen if it's fully below the canvas
        if (fruit.y - fruit.radius > canvas.height) {
          // Mark fruit for removal if it's below the screen
          fruitsToRemove.push(i);
          
          // Only count unsliced fruits as missed
          if (!fruit.sliced) {
            setMissedFruits(prev => {
              const newMissedCount = prev + 1;
              // Check for game over condition
              if (newMissedCount >= 3) {
                setGameState("game_over");
              }
              return newMissedCount;
            });
          }
        } else {
          // Check if all pieces of a sliced fruit are off screen
          if (fruit.sliced && fruit.pieces.length > 0) {
            const allPiecesOffScreen = fruit.pieces.every((piece: FruitPiece) => 
              piece.y > canvas.height + piece.radius
            );
            
            if (allPiecesOffScreen) {
              fruitsToRemove.push(i);
            }
          }
        }
        
        // Keep fruit
        updatedFruits.push(fruit)
        
        // Draw fruit
        drawFruit(fruit)
      }
      
      // Update fruits ref
      fruitsRef.current = updatedFruits.filter((_, i) => !fruitsToRemove.includes(i))
      
      // Update and draw sliced fruits
      const updatedSlicedFruits: SlicedFruit[] = []
      
      for (const sliced of slicedFruitsRef.current) {
        // Don't immediately remove sliced fruits when timeLeft reaches 0
        // Instead, allow them to fall offscreen
        
        // Update each piece with gravity and physics
        sliced.pieces.forEach(piece => {
          // Apply gravity to vertical velocity - same as for regular fruits
          piece.velocityY = (piece.velocityY || 0) + settings.gravityFactor;
          
          // Cap velocities to prevent extreme values
          piece.velocityX = capVelocity(piece.velocityX || 0, 3 * settings.velocityMultiplier);
          piece.velocityY = capVelocity(piece.velocityY, 4 * settings.velocityMultiplier);
          
          // Update positions using velocities
          piece.dx += piece.velocityX || 0;
          piece.dy += piece.velocityY;
          
          // Also update actual x, y positions
          piece.x = sliced.x + piece.dx;
          piece.y = sliced.y + piece.dy;
          
          // Add a small amount of damping to simulate air resistance
          piece.velocityX = piece.velocityX ? piece.velocityX * 0.98 : 0;
        });
        
        // Decrement timeLeft for decomposition effect (but not for removal)
        sliced.timeLeft = Math.max(0, sliced.timeLeft - 1);
        
        // Check if all pieces are below the screen with consistent padding
        const allPiecesBelowScreen = sliced.pieces.every(piece => {
          // Use the piece's x, y position directly
          return piece.y > canvas.height + piece.radius;
        });
        
        // Only remove if all pieces are below the screen
        if (!allPiecesBelowScreen) {
          updatedSlicedFruits.push(sliced);
          
          // Draw sliced fruit
          drawSlicedFruit(sliced);
        }
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
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
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

  // Handle going back to title screen
  const handleBackToTitle = () => {
    setGameState("title")
    // Reset game state
    setMissedFruits(0)
    setScore(0)
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
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono">
      {/* Additional background layers for depth effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-purple-900 opacity-10 blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 rounded-full bg-cyan-900 opacity-5 blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-pink-900 opacity-10 blur-3xl"></div>
      </div>
      
      {/* Floating container wrapper with proper padding */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="floating-container layered-bg w-11/12 h-5/6 flex flex-col overflow-hidden border-[2px] border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)]">
          {/* Game canvas container - remove all padding/margin */}
          <div className="relative w-full h-full overflow-hidden p-0 m-0">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full block absolute inset-0 m-0 p-0" 
            />
          </div>

          {/* UI Overlay - everything else stays the same */}
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
                    onClick={handleStartSelection}
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
                    Just hover over fruits to slice them and score points
                  </CRTText>
                </div>
              </div>
            )}
            
            {gameState === "level_select" && (
              <div className="flex flex-col items-center justify-center space-y-8 pointer-events-auto bg-purple-900 bg-opacity-80 p-8 rounded-xl shadow-xl">
                <CRTText className="text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                  SELECT DIFFICULTY
                </CRTText>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => handleSelectLevel(1)}
                    className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-500 hover:to-blue-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-2">LEVEL 1</span>
                    <span className="text-cyan-300 text-sm mb-1">CHILL MODE</span>
                    <span className="text-white text-xs opacity-80">Normal Speed</span>
                  </button>
                  
                  <button
                    onClick={() => handleSelectLevel(2)}
                    className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-2">LEVEL 2</span>
                    <span className="text-pink-300 text-sm mb-1">HYPER MODE</span>
                    <span className="text-white text-xs opacity-80">50% Faster</span>
                  </button>
                  
                  <button
                    onClick={() => handleSelectLevel(3)}
                    className="px-8 py-6 text-xl font-bold text-white bg-gradient-to-r from-red-600 to-yellow-600 rounded-lg hover:from-red-500 hover:to-yellow-500 transition-colors duration-300 w-64 h-48 flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-2">LEVEL 3</span>
                    <span className="text-yellow-300 text-sm mb-1">EXTREME MODE</span>
                    <span className="text-white text-xs opacity-80">120% Faster</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Game over screen */}
            {gameState === "game_over" && (
              <div className="flex flex-col items-center justify-center space-y-8 pointer-events-auto bg-red-900 bg-opacity-80 p-8 rounded-xl shadow-xl">
                <CRTText className="text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
                  GAME OVER
                </CRTText>
                <CRTText fontSize="text-2xl" className="text-white">
                  YOUR SCORE: {score}
                </CRTText>
                <button
                  onClick={handleBackToTitle}
                  className="mt-4 px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:bg-purple-500 transition-colors duration-300"
                >
                  BACK TO TITLE
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
          `}</style>
        </div>
      </div>
      
      {/* System UI elements - moved score and back button here */}
      <div className="absolute top-5 left-5 z-30 flex items-center space-x-6">
        {/* Back button - only show when in a game state that's not the title */}
        {gameState !== "title" && (
          <button
            onClick={handleBackToTitle}
            className="px-4 py-1 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded hover:from-purple-500 hover:to-pink-500 transition-colors duration-300 shadow-lg shadow-purple-500/20"
          >
            « BACK
          </button>
        )}
        
        {/* Always display score and level when playing */}
        {gameState === "playing" && (
          <div className="flex space-x-4">
            <div className="text-cyan-500 font-mono text-sm md:text-base border border-cyan-500/30 bg-black/50 px-3 py-1 rounded shadow-lg shadow-cyan-500/20">
              <span className="text-cyan-300 mr-2">LVL:</span>{level}
            </div>
            <div className="text-pink-500 font-mono text-sm md:text-base border border-pink-500/30 bg-black/50 px-3 py-1 rounded shadow-lg shadow-pink-500/20">
              <span className="text-pink-300 mr-2">SCORE:</span>{score}
            </div>
            <div className="text-red-500 font-mono text-sm md:text-base border border-red-500/30 bg-black/50 px-3 py-1 rounded shadow-lg shadow-red-500/20">
              <span className="text-red-300 mr-2">MISSED:</span>{missedFruits}/3
            </div>
          </div>
        )}
      </div>
      
      {/* Decorative neon elements */}
      <div className="absolute bottom-5 left-5 z-30 text-cyan-500 text-xs font-mono opacity-70">NEON DIMENSION v1.0</div>
      <div className="absolute top-5 right-5 z-30 text-pink-500 text-xs font-mono opacity-70">[SYSTEM ONLINE]</div>
    </div>
  )
}
