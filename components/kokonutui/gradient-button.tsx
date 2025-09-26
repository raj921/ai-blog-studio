"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  className?: string;
  isLoading?: boolean;
}

export default function GradientButton({
  children,
  onClick,
  disabled = false,
  size = "md",
  variant = "primary",
  className = "",
  isLoading = false,
}: GradientButtonProps) {
  const baseClasses = "relative overflow-hidden font-medium transition-all duration-300";
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border",
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={className}
    >
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          )}
          {children}
        </span>
        
        {/* Shimmer effect */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "linear",
            }}
          />
        )}
      </Button>
    </motion.div>
  );
}