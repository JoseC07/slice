"use client"

import { useEffect, useRef, useState } from "react"

// Fruit type definition
type Fruit = {
  type: "orange" | "lemon" | "lime"
  x: number
  y: number
  radius: number
  rotation: number
  rotationSpeed: number
  floatOffset: number
  floatSpeed: number
  selected: boolean
}

export default function VibrantCitrusDisplay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFruit, setDraggedFruit] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Animation frame reference for cleanup
  const animationRef = useRef<number | undefined>(undefined)

  // Initialize fruits
  useEffect(() => {
    const initializeFruits = () => {
      const newFruits: Fruit[] = []

      // Create 3 oranges
      for (let i = 0; i < 3; i++) {
        newFruits.push({
          type: "orange",
          x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
          y: Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2,
          radius: Math.random() * 20 + 60, // Bigger fruits (60-80px radius)
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1), // Slower rotation
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: Math.random() * 0.001 + 0.0005,
          selected: false,
        })
      }

      // Create 2 lemons
      for (let i = 0; i < 2; i++) {
        newFruits.push({
          type: "lemon",
          x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
          y: Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2,
          radius: Math.random() * 15 + 50, // Slightly smaller
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: Math.random() * 0.001 + 0.0005,
          selected: false,
        })
      }

      // Create 2 limes
      for (let i = 0; i < 2; i++) {
        newFruits.push({
          type: "lime",
          x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
          y: Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2,
          radius: Math.random() * 15 + 40, // Smallest fruits
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: Math.random() * 0.001 + 0.0005,
          selected: false,
        })
      }

      setFruits(newFruits)
    }

    initializeFruits()
  }, [])

  // Main rendering and animation effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setError("Canvas context not supported")
      return
    }

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr

      ctx.scale(dpr, dpr)

      // Reset styles after resize
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }

    setCanvasDimensions()
    window.addEventListener("resize", () => {
      setCanvasDimensions()
      // Reposition fruits after resize to keep them in view
      setFruits((prevFruits) =>
        prevFruits.map((fruit) => ({
          ...fruit,
          x: Math.min(Math.max(fruit.x, fruit.radius), window.innerWidth - fruit.radius),
          y: Math.min(Math.max(fruit.y, fruit.radius), window.innerHeight - fruit.radius),
        })),
      )
    })

    // Draw vibrant background with depth
    const drawBackground = () => {
      // Create a complex gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 / window.devicePixelRatio,
        canvas.height / 2 / window.devicePixelRatio,
        0,
        canvas.width / 2 / window.devicePixelRatio,
        canvas.height / 2 / window.devicePixelRatio,
        Math.max(canvas.width, canvas.height) / window.devicePixelRatio,
      )

      // Vibrant colors
      gradient.addColorStop(0, "#4A00E0") // Deep purple
      gradient.addColorStop(0.4, "#8E2DE2") // Bright purple
      gradient.addColorStop(0.7, "#2F80ED") // Bright blue
      gradient.addColorStop(1, "#1E3B70") // Deep blue

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)

      // Add some "depth" with subtle patterns
      for (let i = 0; i < 100; i++) {
        const x = (Math.random() * canvas.width) / window.devicePixelRatio
        const y = (Math.random() * canvas.height) / window.devicePixelRatio
        const radius = Math.random() * 3 + 1

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
        ctx.fill()
      }
    }

    // Draw a single fruit
    const drawFruit = (fruit: Fruit) => {
      const { type, x, y, radius, rotation } = fruit

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Base colors for each fruit type
      let baseColor, highlightColor, dimpleColor, outlineColor

      switch (type) {
        case "orange":
          baseColor = "#FF7700"
          highlightColor = "#FFAA33"
          dimpleColor = "rgba(255, 150, 0, 0.3)"
          outlineColor = "#E65100"
          break
        case "lemon":
          baseColor = "#FFEB3B"
          highlightColor = "#FFF59D"
          dimpleColor = "rgba(255, 235, 59, 0.3)"
          outlineColor = "#F57F17"
          break
        case "lime":
          baseColor = "#7CB342"
          highlightColor = "#AED581"
          dimpleColor = "rgba(124, 179, 66, 0.3)"
          outlineColor = "#33691E"
          break
      }

      // Draw fruit base with radial gradient
      const fruitGradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
      fruitGradient.addColorStop(0, highlightColor)
      fruitGradient.addColorStop(0.7, baseColor)
      fruitGradient.addColorStop(1, outlineColor)

      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fillStyle = fruitGradient
      ctx.fill()

      // Draw fruit texture (dimples)
      const dimpleCount = Math.floor(radius * 1.5)
      for (let i = 0; i < dimpleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * radius * 0.9

        const dimpleX = Math.cos(angle) * distance
        const dimpleY = Math.sin(angle) * distance

        // Only draw dimples within the fruit circle
        const distanceFromCenter = Math.sqrt(dimpleX * dimpleX + dimpleY * dimpleY)

        if (distanceFromCenter <= radius) {
          const dimpleSize = Math.random() * radius * 0.05 + radius * 0.02

          ctx.beginPath()
          ctx.arc(dimpleX, dimpleY, dimpleSize, 0, Math.PI * 2)
          ctx.fillStyle = dimpleColor
          ctx.fill()
        }
      }

      // Draw highlights
      const highlightGradient = ctx.createRadialGradient(
        -radius * 0.4,
        -radius * 0.4,
        0,
        -radius * 0.4,
        -radius * 0.4,
        radius * 0.7,
      )
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)")
      highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)")
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.beginPath()
      ctx.arc(-radius * 0.4, -radius * 0.4, radius * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()

      // Draw stem and leaf
      if (type === "orange" || type === "lemon" || type === "lime") {
        // Stem base
        ctx.beginPath()
        ctx.arc(0, -radius * 0.9, radius * 0.1, 0, Math.PI * 2)
        ctx.fillStyle = "#5D4037"
        ctx.fill()

        // Stem
        ctx.beginPath()
        ctx.moveTo(-radius * 0.05, -radius * 0.95)
        ctx.quadraticCurveTo(0, -radius * 1.2, radius * 0.1, -radius * 1.1)
        ctx.lineWidth = radius * 0.05
        ctx.strokeStyle = "#5D4037"
        ctx.stroke()

        // Leaf
        ctx.beginPath()
        ctx.moveTo(radius * 0.1, -radius * 1.1)
        ctx.bezierCurveTo(radius * 0.3, -radius * 1.2, radius * 0.4, -radius * 1.0, radius * 0.2, -radius * 0.9)
        ctx.bezierCurveTo(radius * 0.3, -radius * 0.8, radius * 0.2, -radius * 1.0, radius * 0.1, -radius * 1.1)

        // Leaf color based on fruit type
        let leafColor = "#388E3C"
        if (type === "lemon") {
          leafColor = "#689F38"
        } else if (type === "lime") {
          leafColor = "#2E7D32"
        }

        ctx.fillStyle = leafColor
        ctx.fill()
      }

      // Draw outline
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.lineWidth = 2
      ctx.strokeStyle = outlineColor
      ctx.stroke()

      // Draw selection indicator if selected
      if (fruit.selected) {
        ctx.beginPath()
        ctx.arc(0, 0, radius + 10, 0, Math.PI * 2)
        ctx.lineWidth = 3
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.restore()
    }

    // Animation function
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)

      // Draw background
      drawBackground()

      // Update and draw fruits
      setFruits((prevFruits) => {
        return prevFruits.map((fruit) => {
          // Skip updating position if being dragged
          if (isDragging && fruit.selected) {
            return fruit
          }

          // Update rotation
          const newRotation = fruit.rotation + fruit.rotationSpeed

          // Update floating position
          const floatY = Math.sin(time * fruit.floatSpeed + fruit.floatOffset) * 15

          return {
            ...fruit,
            rotation: newRotation,
            y: fruit.y + floatY - (prevFruits.find((f) => f.type === fruit.type && f.selected)?.y || 0),
          }
        })
      })

      // Draw fruits in order (smaller ones first for better layering)
      const sortedFruits = [...fruits].sort((a, b) => a.radius - b.radius)
      sortedFruits.forEach(drawFruit)

      // Continue animation
      animationRef.current = requestAnimationFrame(animate)

      // No longer loading
      if (isLoading) {
        setIsLoading(false)
      }
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [fruits, isDragging])

  // Handle mouse/touch interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width / window.devicePixelRatio)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height / window.devicePixelRatio)

      // Check if we clicked on a fruit
      let clickedFruitIndex = -1

      // Check in reverse order (top fruits first)
      for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i]
        const distance = Math.sqrt(Math.pow(x - fruit.x, 2) + Math.pow(y - fruit.y, 2))

        if (distance <= fruit.radius) {
          clickedFruitIndex = i
          break
        }
      }

      if (clickedFruitIndex >= 0) {
        setIsDragging(true)
        setDraggedFruit(clickedFruitIndex)
        setMousePos({ x, y })

        // Update selected state
        setFruits((prevFruits) =>
          prevFruits.map((fruit, index) => ({
            ...fruit,
            selected: index === clickedFruitIndex,
          })),
        )
      } else {
        // Deselect all if clicking on empty space
        setFruits((prevFruits) =>
          prevFruits.map((fruit) => ({
            ...fruit,
            selected: false,
          })),
        )
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || draggedFruit === null) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width / window.devicePixelRatio)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height / window.devicePixelRatio)

      const deltaX = x - mousePos.x
      const deltaY = y - mousePos.y

      setMousePos({ x, y })

      // Update fruit position
      setFruits((prevFruits) =>
        prevFruits.map((fruit, index) => {
          if (index === draggedFruit) {
            // Keep fruit within canvas bounds
            const newX = Math.min(
              Math.max(fruit.x + deltaX, fruit.radius),
              canvas.width / window.devicePixelRatio - fruit.radius,
            )
            const newY = Math.min(
              Math.max(fruit.y + deltaY, fruit.radius),
              canvas.height / window.devicePixelRatio - fruit.radius,
            )

            return {
              ...fruit,
              x: newX,
              y: newY,
            }
          }
          return fruit
        }),
      )
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDraggedFruit(null)
    }

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    // Touch events for mobile
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      })
      handleMouseDown(mouseEvent)
    })

    window.addEventListener("touchmove", (e) => {
      if (!isDragging) return
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      })
      handleMouseMove(mouseEvent)
    })

    window.addEventListener("touchend", () => {
      handleMouseUp()
    })

    // Cleanup
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      canvas.removeEventListener("touchstart", (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        })
        handleMouseDown(mouseEvent)
      })

      window.removeEventListener("touchmove", (e) => {
        if (!isDragging) return
        e.preventDefault()
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        })
        handleMouseMove(mouseEvent)
      })

      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [fruits, isDragging, draggedFruit, mousePos.x, mousePos.y])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-80 z-10">
          <div className="text-white text-xl">Loading citrus display...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900 bg-opacity-80 z-10">
          <div className="text-white text-xl">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="block mx-auto mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full" style={{ display: error ? "none" : "block" }} />

      <div className="absolute bottom-4 left-4 text-white text-lg bg-black bg-opacity-50 p-2 rounded">
        Drag the fruits to move them around!
      </div>
    </div>
  )
}

