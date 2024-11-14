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
    value: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    icon: Sparkles,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  { 
    provider: 'OpenRouter',
    value: 'google/gemma-2-9b-it:free',
    label: 'Gemma 2 9B',
    icon: Cloud,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  { 
    provider: 'OpenRouter',
    value: 'anthropic/claude-3.5-sonnet:beta',
    label: 'Claude 3.5',
    icon: FlaskConical,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
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
          bg-white/80 backdrop-blur-sm border border-gray-100
          rounded-xl shadow-sm hover:shadow-md transition-all duration-200
          ${isChatMode ? 'h-9' : 'h-9'} px-3
          focus:outline-none focus:ring-1 focus:ring-gray-100 focus:border-gray-200`}
      >
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent 
        className="rounded-xl bg-white/95 backdrop-blur-xl border border-gray-100/60 shadow-lg 
          max-h-[280px] overflow-y-auto p-0.5 min-w-[160px] focus:outline-none"
      >
        <SelectGroup className="px-0.5">
          {MODEL_CONFIGS.map((model) => (
            <SelectItem 
              key={model.value} 
              value={model.value}
              className="group focus:bg-gray-50/70 rounded-lg py-0 outline-none 
                data-[highlighted]:bg-gray-50/70 data-[highlighted]:outline-none
                focus:outline-none focus:ring-0 focus-visible:outline-none
                focus-visible:ring-0"
            >
              <motion.div 
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg
                  hover:bg-gray-50/70 transition-colors duration-150
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
                  <span className="text-[13px] font-medium text-gray-600 truncate">
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
