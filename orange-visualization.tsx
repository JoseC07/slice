"use client"

import { useEffect, useRef, useState } from "react"

export default function OrangeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      ctx.scale(dpr, dpr)

      // Reset styles after resize
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Draw the orange
    const drawOrange = () => {
      try {
        setIsLoading(true)

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Get dimensions for responsive sizing
        const width = canvas.width / window.devicePixelRatio
        const height = canvas.height / window.devicePixelRatio
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) * 0.35

        // Draw orange base with radial gradient
        const orangeGradient = ctx.createRadialGradient(
          centerX - radius * 0.3,
          centerY - radius * 0.3,
          0,
          centerX,
          centerY,
          radius,
        )
        orangeGradient.addColorStop(0, "#FFAA33")
        orangeGradient.addColorStop(0.7, "#FF7700")
        orangeGradient.addColorStop(1, "#E65100")

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fillStyle = orangeGradient
        ctx.fill()

        // Draw orange texture (dimples)
        const drawDimples = () => {
          // Create a pattern of small circles for texture
          for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * radius * 0.9

            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance

            // Only draw dimples within the orange circle
            const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

            if (distanceFromCenter <= radius) {
              const dimpleSize = Math.random() * 3 + 1

              ctx.beginPath()
              ctx.arc(x, y, dimpleSize, 0, Math.PI * 2)
              ctx.fillStyle = "rgba(255, 150, 0, 0.3)"
              ctx.fill()

              ctx.beginPath()
              ctx.arc(x, y, dimpleSize / 2, 0, Math.PI * 2)
              ctx.fillStyle = "rgba(255, 200, 150, 0.4)"
              ctx.fill()
            }
          }
        }

        drawDimples()

        // Draw highlights
        const drawHighlights = () => {
          // Main highlight
          const highlightGradient = ctx.createRadialGradient(
            centerX - radius * 0.4,
            centerY - radius * 0.4,
            0,
            centerX - radius * 0.4,
            centerY - radius * 0.4,
            radius * 0.7,
          )
          highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)")
          highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)")
          highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

          ctx.beginPath()
          ctx.arc(centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.7, 0, Math.PI * 2)
          ctx.fillStyle = highlightGradient
          ctx.fill()

          // Small secondary highlight
          const smallHighlightGradient = ctx.createRadialGradient(
            centerX + radius * 0.5,
            centerY + radius * 0.5,
            0,
            centerX + radius * 0.5,
            centerY + radius * 0.5,
            radius * 0.3,
          )
          smallHighlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)")
          smallHighlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

          ctx.beginPath()
          ctx.arc(centerX + radius * 0.5, centerY + radius * 0.5, radius * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = smallHighlightGradient
          ctx.fill()
        }

        drawHighlights()

        // Draw stem
        const drawStem = () => {
          // Stem base
          ctx.beginPath()
          ctx.arc(centerX, centerY - radius * 0.9, radius * 0.1, 0, Math.PI * 2)
          ctx.fillStyle = "#5D4037"
          ctx.fill()

          // Stem
          ctx.beginPath()
          ctx.moveTo(centerX - radius * 0.05, centerY - radius * 0.95)
          ctx.quadraticCurveTo(centerX, centerY - radius * 1.2, centerX + radius * 0.1, centerY - radius * 1.1)
          ctx.lineWidth = radius * 0.05
          ctx.strokeStyle = "#5D4037"
          ctx.stroke()

          // Leaf
          ctx.beginPath()
          ctx.moveTo(centerX + radius * 0.1, centerY - radius * 1.1)
          ctx.bezierCurveTo(
            centerX + radius * 0.3,
            centerY - radius * 1.2,
            centerX + radius * 0.4,
            centerY - radius * 1.0,
            centerX + radius * 0.2,
            centerY - radius * 0.9,
          )
          ctx.bezierCurveTo(
            centerX + radius * 0.3,
            centerY - radius * 0.8,
            centerX + radius * 0.2,
            centerY - radius * 1.0,
            centerX + radius * 0.1,
            centerY - radius * 1.1,
          )

          // Leaf gradient
          const leafGradient = ctx.createLinearGradient(
            centerX + radius * 0.1,
            centerY - radius * 1.1,
            centerX + radius * 0.3,
            centerY - radius * 0.9,
          )
          leafGradient.addColorStop(0, "#388E3C")
          leafGradient.addColorStop(1, "#2E7D32")

          ctx.fillStyle = leafGradient
          ctx.fill()

          // Leaf vein
          ctx.beginPath()
          ctx.moveTo(centerX + radius * 0.1, centerY - radius * 1.1)
          ctx.quadraticCurveTo(
            centerX + radius * 0.25,
            centerY - radius * 1.0,
            centerX + radius * 0.2,
            centerY - radius * 0.9,
          )
          ctx.lineWidth = 1
          ctx.strokeStyle = "#1B5E20"
          ctx.stroke()
        }

        drawStem()

        // Draw outline
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.lineWidth = 2
        ctx.strokeStyle = "#E65100"
        ctx.stroke()

        setIsLoading(false)
      } catch (err) {
        console.error("Error drawing orange:", err)
        setError("Failed to render orange")
        setIsLoading(false)
      }
    }

    // Draw the orange
    drawOrange()

    // Add a small animation effect
    let animationFrameId: number
    let scale = 1
    let growing = true

    const animate = () => {
      // Subtle pulsing effect
      if (growing) {
        scale += 0.0005
        if (scale >= 1.02) growing = false
      } else {
        scale -= 0.0005
        if (scale <= 0.98) growing = true
      }

      // Clear and redraw with scale
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(canvas.width / (2 * window.devicePixelRatio), canvas.height / (2 * window.devicePixelRatio))
      ctx.scale(scale, scale)
      ctx.translate(-canvas.width / (2 * window.devicePixelRatio), -canvas.height / (2 * window.devicePixelRatio))

      drawOrange()

      ctx.restore()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-orange-500 text-xl">Loading orange...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-red-500 text-xl">
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

      <canvas ref={canvasRef} className="w-4/5 h-4/5 max-w-lg max-h-lg" style={{ display: error ? "none" : "block" }} />
    </div>
  )
}

