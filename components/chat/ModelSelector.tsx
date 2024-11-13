"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Cpu, Brain, Zap, Star, Lightbulb, Atom } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define model types
interface ModelOption {
  value: string;
  label: string;
  provider: string;
  color: string;
  icon?: React.ElementType;
}

// Provider icons and colors mapping
const providerConfig = {
  'OpenAI': { icon: Sparkles, color: 'text-green-500 bg-green-50' },
  'Anthropic': { icon: Brain, color: 'text-purple-500 bg-purple-50' },
  'Mistral': { icon: Cpu, color: 'text-blue-500 bg-blue-50' },
  'X.AI': { icon: Atom, color: 'text-gray-700 bg-gray-100' },
  'Groq': { icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
  'OpenRouter': { icon: Star, color: 'text-indigo-500 bg-indigo-50' },
  'Google': { icon: Lightbulb, color: 'text-red-500 bg-red-50' },
  'Together': { icon: Bot, color: 'text-orange-500 bg-orange-50' },
};

const MODELS: ModelOption[] = [
  // Groq Models
  { 
    provider: 'Groq', 
    value: 'groq', 
    label: 'Llama 3.2 90B Vision', 
    color: 'text-yellow-600 bg-yellow-50',
  },
  
  // Google Models
  { 
    provider: 'Google', 
    value: 'gemini-1.5-flash', 
    label: 'Gemini 1.5 Flash', 
    color: 'text-red-400 bg-red-50',
  },
  { 
    provider: 'Google', 
    value: 'gemini-1.5-pro', 
    label: 'Gemini 1.5 Pro', 
    color: 'text-red-500 bg-red-50',
  },
  
  // Mistral Models
  { 
    provider: 'Mistral', 
    value: 'open-mistral-nemo', 
    label: 'Open Mistral Nemo', 
    color: 'text-blue-500 bg-blue-50',
  },
  { 
    provider: 'Mistral', 
    value: 'mistral-large', 
    label: 'Mistral Large 2407', 
    color: 'text-blue-600 bg-blue-50',
  },
  { 
    provider: 'Mistral', 
    value: 'pixtral-12b-2409', 
    label: 'Pixtral 12B', 
    color: 'text-blue-500 bg-blue-50',
  },
  { 
    provider: 'Mistral', 
    value: 'codestral-mamba-2407', 
    label: 'Codestral Mamba', 
    color: 'text-blue-600 bg-blue-50',
  },
  
  // X.AI Models
  { 
    provider: 'X.AI', 
    value: 'xai', 
    label: 'Grok', 
    color: 'text-gray-700 bg-gray-100',
  },
  
  // OpenRouter Models
  { 
    provider: 'OpenRouter', 
    value: 'openai/gpt-4o-mini', 
    label: 'GPT-4o Mini', 
    color: 'text-indigo-500 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemma-2-9b-it:free', 
    label: 'Gemma 2 9B IT (Free)', 
    color: 'text-indigo-600 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'anthropic/claude-3.5-sonnet:beta', 
    label: 'Claude 3.5 Sonnet (Beta)', 
    color: 'text-indigo-700 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'anthropic/claude-3-5-haiku-20241022', 
    label: 'Claude 3.5 Haiku', 
    color: 'text-indigo-800 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'nvidia/llama-3.1-nemotron-70b-instruct', 
    label: 'Nvidia Llama 3.1 Nemotron 70B', 
    color: 'text-indigo-900 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'qwen/qwen-2.5-7b-instruct', 
    label: 'Qwen 2.5 7B Instruct', 
    color: 'text-indigo-400 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'meta-llama/llama-3.2-11b-vision-instruct:free', 
    label: 'Llama 3.2 11B Vision (Free)', 
    color: 'text-indigo-300 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-pro-1.5-exp', 
    label: 'Gemini Pro 1.5 (Experimental)', 
    color: 'text-indigo-200 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-1.5-flash-001', 
    label: 'Gemini 1.5 Flash', 
    color: 'text-indigo-500 bg-indigo-50',
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemini-1.5-pro-001', 
    label: 'Gemini 1.5 Pro', 
    color: 'text-indigo-600 bg-indigo-50',
  },
  // Together AI Models
  { 
    provider: 'Together', 
    value: 'together/meta-llama/Llama-Vision-Free', 
    label: 'Llama Vision Free', 
    color: 'text-orange-500 bg-orange-50',
  },
  { 
    provider: 'Together', 
    value: 'together/black-forest-labs/FLUX.1-schnell-Free', 
    label: 'FLUX.1 Schnell', 
    color: 'text-orange-600 bg-orange-50',
  },
  { 
    provider: 'Together', 
    value: 'together/black-forest-labs/FLUX.1.1-pro', 
    label: 'FLUX.1.1 Pro', 
    color: 'text-orange-700 bg-orange-50',
  },
];

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
  compact?: boolean;
  isChatMode?: boolean;
}

export function ModelSelector({ onModelChange, compact, isChatMode }: ModelSelectorProps) {
  const models = [
    { id: 'groq', name: 'Llama 3.2 90B Vision' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'mistral-large', name: 'Mistral Large' },
    { id: 'open-mistral-nemo', name: 'Open Mistral Nemo' },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B' },
    { id: 'codestral-mamba-2407', name: 'Codestral Mamba' },
    { id: 'xai', name: 'Grok Beta' },
  ];

  return (
    <Select onValueChange={onModelChange}>
      <SelectTrigger className={`${compact ? 'w-[150px]' : 'w-[200px]'} ${
        isChatMode ? 'bg-white/50 backdrop-blur-[10px] border-white/20' : ''
      }`}>
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
