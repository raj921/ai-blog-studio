"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";

interface AIPromptProps {
  onSubmit?: (prompt: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export default function AIPrompt({ 
  onSubmit, 
  placeholder = "Enter your blog topic or idea...", 
  isLoading = false,
  className = ""
}: AIPromptProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="min-h-[120px] pr-12 resize-none border-2 border-gradient-to-r from-purple-500/20 to-blue-500/20 focus:border-purple-500/50 transition-all duration-300"
        />
        <motion.div
          className="absolute bottom-3 right-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}