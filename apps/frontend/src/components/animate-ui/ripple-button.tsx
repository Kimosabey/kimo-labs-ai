"use client"

import * as React from "react"
import { motion, type HTMLMotionProps, type Transition, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const RippleButton = React.forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button"> & { hoverScale?: number; tapScale?: number }
>(({ className, hoverScale = 1.05, tapScale = 0.95, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
RippleButton.displayName = "RippleButton"

const RippleButtonRipples = ({
  color = "rgba(255, 255, 255, 0.3)",
  scale = 10,
  transition = { duration: 0.6, ease: "easeOut" },
  ...props
}: { color?: string; scale?: number; transition?: Transition } & React.HTMLAttributes<HTMLSpanElement>) => {
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([])

  const onPointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
  }

  return (
    <span
      onPointerDown={onPointerDown}
      className="absolute inset-0 z-0"
      {...props}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
            }}
            style={{
              position: "absolute",
              top: ripple.y,
              left: ripple.x,
              width: 1,
              height: 1,
              backgroundColor: color,
              borderRadius: "50%",
              pointerEvents: "none",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  )
}

export { RippleButton, RippleButtonRipples }
