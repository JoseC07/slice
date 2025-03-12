"use client"

import { useEffect, useRef } from "react"

export default function CanvasOrange() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    let animationFrameId: number
    let rotation = 0

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    // Animation function
    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#121212"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Center position
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.2

      // Draw orange
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation)

      // Orange circle
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#FF5500"
      ctx.fill()

      // Black outline
      ctx.lineWidth = 10
      ctx.strokeStyle = "black"
      ctx.stroke()

      // Segment lines
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, radius)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)"
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.rotate(Math.PI / 4)
      }

      // Stem
      ctx.beginPath()
      ctx.rect(-radius * 0.1, -radius - radius * 0.2, radius * 0.2, radius * 0.2)
      ctx.fillStyle = "#3A7D44"
      ctx.fill()

      ctx.restore()

      // Update rotation
      rotation += 0.01

      // Continue animation loop
      animationFrameId = window.requestAnimationFrame(render)
    }

    render()

    // Cleanup
    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-screen bg-black" />
}

