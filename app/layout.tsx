import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neon Fruit Ninja",
  description: "A fun fruit slicing game with neon aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style jsx global>{`
          :root {
            --neon-purple: #9333ea;
            --neon-pink: #ec4899;
            --neon-blue: #3b82f6;
            --neon-cyan: #06b6d4;
            --deep-space: #0D0221;
            --mid-purple: #3D0E61;
            --bright-purple: #4A00E0;
          }
          
          body {
            background: linear-gradient(to bottom, var(--deep-space), var(--mid-purple), var(--bright-purple));
            overflow: hidden;
            perspective: 1000px;
          }
          
          /* Add depth to all elements with shadows */
          .depth-shadow {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          
          /* Enhance text with neon glow */
          .neon-text {
            text-shadow: 
              0 0 5px rgba(255, 255, 255, 0.8),
              0 0 10px currentColor,
              0 0 20px currentColor;
          }
          
          /* Add 3D transform to elements */
          .transform-3d {
            transform-style: preserve-3d;
            transition: transform 0.3s ease;
          }
          
          /* Enhance canvas performance */
          canvas {
            image-rendering: optimizeSpeed;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: optimize-contrast;
            image-rendering: pixelated;
            -ms-interpolation-mode: nearest-neighbor;
          }
          
          /* Add subtle animation to background */
          @keyframes subtle-pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
          }
          
          .bg-pulse {
            animation: subtle-pulse 8s infinite ease-in-out;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
