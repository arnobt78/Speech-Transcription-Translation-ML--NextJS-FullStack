/**
 * AnimatedContainer — Framer Motion Wrapper for Entrance Animations
 *
 * Provides a consistent entrance animation for UI elements.
 * Wraps content in a `motion.div` that animates from a specified direction.
 *
 * Usage:
 *   <AnimatedContainer direction="bottom" delay={0.2}>
 *     <Card>...</Card>
 *   </AnimatedContainer>
 *
 * Props:
 * - `direction`: Which direction the element slides in from
 * - `delay`: How long to wait before starting the animation
 * - `duration`: How long the animation takes
 * - `className`: Additional Tailwind classes
 */

"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  /** Direction the element animates in from */
  direction?: "left" | "right" | "bottom" | "top";
  /** Delay before the animation starts (in seconds) */
  delay?: number;
  /** Duration of the animation (in seconds) */
  duration?: number;
  /** Additional Tailwind class names */
  className?: string;
}

/** Map direction to initial position offset */
const directionMap = {
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
  top: { x: 0, y: -40 },
  bottom: { x: 0, y: 40 },
};

export function AnimatedContainer({
  children,
  direction = "bottom",
  delay = 0,
  duration = 0.5,
  className,
}: AnimatedContainerProps) {
  const offset = directionMap[direction];

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
