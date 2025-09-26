"use client";

import { motion } from "framer-motion";

interface AITextLoadingProps {
  text?: string;
  className?: string;
}

export default function AITextLoading({ 
  text = "AI is generating...", 
  className = "" 
}: AITextLoadingProps) {
  const words = text.split(" ");

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: words.length * 0.1,
          }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 font-medium"
        >
          {word}
        </motion.span>
      ))}
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-5 bg-gradient-to-r from-purple-600 to-blue-600 ml-1"
      />
    </div>
  );
}