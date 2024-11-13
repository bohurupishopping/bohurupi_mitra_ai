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
    provider: 'Groq',
    value: 'groq',
    label: 'Llama 3.2 90B',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  { 
    provider: 'Mistral',
    value: 'open-mistral-nemo',
    label: 'Open Mistral Nemo',
    icon: Cpu,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  { 
    provider: 'Mistral',
    value: 'mistral-large',
    label: 'Mistral Large',
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
  const IconComponent = ({ icon: Icon, color, bgColor }: { 
    icon: React.ElementType,
    color: string,
    bgColor: string
  }) => (
    <div className={`p-1.5 rounded-lg ${bgColor}`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
    </div>
  );

  return (
    <Select onValueChange={onModelChange}>
      <SelectTrigger 
        className={`${compact ? 'w-[180px]' : 'w-[220px]'} 
          bg-white/50 backdrop-blur-md border border-white/20
          rounded-2xl shadow-sm hover:shadow-md transition-all duration-300
          ${isChatMode ? 'h-10' : ''}`}
      >
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent 
        className="rounded-xl bg-white/90 backdrop-blur-xl border-white/20 shadow-lg 
          max-h-[300px] overflow-y-auto"
      >
        <SelectGroup>
          {MODEL_CONFIGS.map((model) => (
            <SelectItem 
              key={model.value} 
              value={model.value}
              className="group"
            >
              <motion.div 
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg
                  hover:bg-gray-50/50 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <IconComponent 
                  icon={model.icon} 
                  color={model.color} 
                  bgColor={model.bgColor} 
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">
                    {model.provider} | {model.label}
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
