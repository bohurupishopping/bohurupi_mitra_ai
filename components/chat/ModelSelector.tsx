"use client";

import React from 'react';
import { Sparkles, Bot, Cpu, Brain, Zap, Star, Lightbulb, Atom, Wand2, Rocket, Cloud, FlaskConical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
  compact?: boolean;
  isChatMode?: boolean;
}

const MODEL_CONFIGS = [
  { 
    provider: 'Groq',
    value: 'groq',
    label: 'Llama 3.2 90B',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  { 
    provider: 'Google',
    value: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    icon: Lightbulb,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  { 
    provider: 'Google',
    value: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    icon: Wand2,
    color: 'text-red-400',
    bgColor: 'bg-red-50',
  },
  { 
    provider: 'Mistral',
    value: 'open-mistral-nemo',
    label: 'Nemo',
    icon: Cpu,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  { 
    provider: 'Mistral',
    value: 'mistral-large',
    label: 'Large',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  { 
    provider: 'X.AI',
    value: 'xai',
    label: 'Grok',
    icon: Rocket,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
  { 
    provider: 'OpenRouter',
    value: 'nousresearch/hermes-3-llama-3.1-405b:free',
    label: 'Hermes 3 405B',
    icon: Brain,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  { 
    provider: 'OpenRouter',
    value: 'meta-llama/llama-3.1-70b-instruct:free',
    label: 'Llama 3.1 70B',
    icon: Sparkles,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  }
];

export function ModelSelector({ onModelChange, compact, isChatMode }: ModelSelectorProps) {
  React.useEffect(() => {
    onModelChange('groq');
  }, []);

  const IconComponent = ({ icon: Icon, color, bgColor }: { 
    icon: React.ElementType,
    color: string,
    bgColor: string
  }) => (
    <div className={`p-1 rounded-lg ${bgColor}`}>
      <Icon className={`h-3 w-3 ${color}`} />
    </div>
  );

  return (
    <Select onValueChange={onModelChange}>
      <SelectTrigger 
        className={`${compact ? 'w-[160px]' : 'w-[180px]'} 
          bg-white/10 backdrop-blur-sm border border-white/20
          rounded-xl shadow-sm hover:shadow-md transition-all duration-200
          ${isChatMode ? 'h-9' : 'h-9'} px-3
          focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30
          text-gray-600 hover:bg-white/20
          group relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent 
        className="rounded-xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-lg 
          max-h-[280px] overflow-y-auto p-1 min-w-[160px] focus:outline-none
          animate-in fade-in-0 zoom-in-95"
      >
        <SelectGroup className="px-0.5">
          {MODEL_CONFIGS.map((model) => (
            <SelectItem 
              key={model.value} 
              value={model.value}
              className="group focus:bg-gray-50/70 rounded-lg py-0 outline-none 
                data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-purple-500/20 data-[highlighted]:to-blue-500/20
                data-[highlighted]:outline-none
                focus:outline-none focus:ring-0 focus-visible:outline-none
                focus-visible:ring-0 relative overflow-hidden"
            >
              <motion.div 
                className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg
                  hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 
                  transition-colors duration-150
                  focus:outline-none"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <IconComponent 
                  icon={model.icon} 
                  color={model.color} 
                  bgColor={`${model.bgColor} bg-opacity-60`} 
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-gray-700 truncate">
                    {model.provider} {model.label}
                  </span>
                </div>
              </motion.div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
