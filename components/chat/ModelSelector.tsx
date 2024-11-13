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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define model types
interface ModelOption {
  value: string;
  label: string;
  provider: Provider;
  color: string;
  description?: string;
  isNew?: boolean;
  isFree?: boolean;
}

type Provider = 'OpenAI' | 'Anthropic' | 'Mistral' | 'X.AI' | 'Groq' | 'OpenRouter' | 'Google' | 'Together';

// Provider configuration with proper typing
const providerConfig: Record<Provider, { icon: React.ElementType; color: string }> = {
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
    description: 'Fast and powerful vision model',
    isNew: true
  },
  
  // Mistral Models
  { 
    provider: 'Mistral', 
    value: 'open-mistral-nemo', 
    label: 'Open Mistral Nemo', 
    color: 'text-blue-500 bg-blue-50',
    description: 'Open source Mistral model'
  },
  { 
    provider: 'Mistral', 
    value: 'mistral-large', 
    label: 'Mistral Large 2407', 
    color: 'text-blue-600 bg-blue-50',
    description: 'Latest Mistral large model'
  },
  { 
    provider: 'Mistral', 
    value: 'pixtral-12b-2409', 
    label: 'Pixtral 12B', 
    color: 'text-blue-500 bg-blue-50',
    description: 'Vision-enhanced Mistral model'
  },
  { 
    provider: 'Mistral', 
    value: 'codestral-mamba-2407', 
    label: 'Codestral Mamba', 
    color: 'text-blue-600 bg-blue-50',
    description: 'Code-optimized Mistral model'
  },
  
  // X.AI Models
  { 
    provider: 'X.AI', 
    value: 'xai', 
    label: 'Grok', 
    color: 'text-gray-700 bg-gray-100',
    description: 'X.AI\'s Grok model',
    isNew: true
  },
  
  // OpenRouter Models
  { 
    provider: 'OpenRouter', 
    value: 'openai/gpt-4o-mini', 
    label: 'GPT-4o Mini', 
    color: 'text-indigo-500 bg-indigo-50',
    description: 'Optimized GPT-4 variant'
  },
  { 
    provider: 'OpenRouter', 
    value: 'google/gemma-2-9b-it:free', 
    label: 'Gemma 2 9B IT', 
    color: 'text-indigo-600 bg-indigo-50',
    description: 'Free Google Gemma model',
    isFree: true
  },
  { 
    provider: 'OpenRouter', 
    value: 'anthropic/claude-3.5-sonnet:beta', 
    label: 'Claude 3.5 Sonnet', 
    color: 'text-indigo-700 bg-indigo-50',
    description: 'Latest Claude model (Beta)',
    isNew: true
  },
  
  // Together AI Models
  { 
    provider: 'Together', 
    value: 'together/meta-llama/Llama-Vision-Free', 
    label: 'Llama Vision Free', 
    color: 'text-orange-500 bg-orange-50',
    description: 'Free vision model',
    isFree: true
  }
];

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
  compact?: boolean;
  isChatMode?: boolean;
}

export function ModelSelector({ onModelChange, compact, isChatMode }: ModelSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const { toast } = useToast();

  const handleModelSelect = (modelValue: string) => {
    const model = MODELS.find(m => m.value === modelValue);
    if (model) {
      onModelChange(modelValue);
      toast({
        title: `Selected ${model.label}`,
        description: model.description || `Switched to ${model.provider} model`,
        duration: 2000,
      });
    }
  };

  const filteredModels = selectedProvider 
    ? MODELS.filter(model => model.provider === selectedProvider)
    : MODELS;

  return (
    <Select onValueChange={handleModelSelect}>
      <SelectTrigger 
        className={`${compact ? 'w-[150px]' : 'w-[200px]'} ${
          isChatMode ? 'bg-white/50 backdrop-blur-[10px] border-white/20' : ''
        }`}
      >
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(Object.keys(providerConfig) as Provider[]).map(provider => {
            const models = MODELS.filter(m => m.provider === provider);
            if (models.length === 0) return null;

            const ProviderIcon = providerConfig[provider].icon;
            
            return (
              <React.Fragment key={provider}>
                <SelectLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ProviderIcon className={`h-4 w-4 ${providerConfig[provider].color}`} />
                  {provider}
                </SelectLabel>
                {models.map(model => (
                  <SelectItem 
                    key={model.value} 
                    value={model.value}
                    className="pl-6 relative group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{model.label}</span>
                        {model.isNew && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">New</span>
                        )}
                        {model.isFree && (
                          <span className="px-1.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">Free</span>
                        )}
                      </span>
                    </div>
                    {model.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                    )}
                  </SelectItem>
                ))}
              </React.Fragment>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
