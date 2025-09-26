"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SmoothTabProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export default function SmoothTab({ 
  tabs, 
  defaultTab, 
  onTabChange,
  className = ""
}: SmoothTabProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-background shadow-sm rounded-md"
                initial={false}
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}