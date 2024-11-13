import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Cpu, Brain, Zap, Star, Lightbulb, Atom } from 'lucide-react';
import { useNavigate } from 'react-router-dom'

import { useToast } from "@/components/ui/use-toast"

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

// Define props interface
interface ModelSelectorProps {
  onModelChange?: (model: string) => void;
  compact?: boolean;
  isChatMode?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  onModelChange, 
  compact,
  isChatMode = false
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState('Groq');
  const [selectedModel, setSelectedModel] = useState('groq');

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    // Find first model of the selected provider
    const firstModelOfProvider = MODELS.find(m => m.provider === provider);
    if (firstModelOfProvider) {
      setSelectedModel(firstModelOfProvider.value);
      onModelChange?.(firstModelOfProvider.value);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    onModelChange?.(model);
  };

  // Get models for the selected provider
  const providerModels = MODELS.filter(m => m.provider === selectedProvider);
  const ProviderIcon = providerConfig[selectedProvider as keyof typeof providerConfig]?.icon;
  const providerColor = providerConfig[selectedProvider as keyof typeof providerConfig]?.color;

  return (
    <div className={`flex flex-row gap-1 sm:gap-3 w-full items-center px-0.5 sm:px-0 
      ${isChatMode ? 'max-w-[600px]' : ''}`}
    >
      {/* Provider and Model Selectors */}
      <div className="flex-1 flex items-center gap-1 sm:gap-3">
        {/* Provider Selector */}
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger 
            className={`${
              compact 
                ? 'w-[90px] sm:w-[120px]'
                : isChatMode
                  ? 'w-[100px] sm:w-[130px] lg:w-[150px]'
                  : 'w-[120px] sm:w-[150px] lg:w-[180px]'
            } bg-white/10 backdrop-blur-xl 
              border-white/20 
              transition-all duration-300 hover:border-blue-300/50
              focus:border-blue-300/50 focus:ring-0 focus:ring-offset-0
              ${isChatMode ? 'rounded-xl' : 'rounded-lg sm:rounded-xl lg:rounded-2xl'}
              shadow-[0_2px_10px_rgba(0,0,0,0.06)] 
              hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
              px-2 sm:px-3
              h-8 sm:h-9
              text-[11px] sm:text-xs
              flex items-center`}
          >
            <SelectValue placeholder="Provider" className="text-gray-600" />
          </SelectTrigger>
          <SelectContent 
            className="bg-white/90 backdrop-blur-xl border-gray-200/50 
              rounded-xl
              shadow-lg animate-in fade-in-80 slide-in-from-top-1 
              p-1.5 
              min-w-[150px] sm:min-w-[180px]
              max-h-[300px]"
            position={isChatMode ? "popper" : "item-aligned"}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 sm:space-y-1"
            >
              {Array.from(new Set(MODELS.map(m => m.provider))).map(provider => {
                const { icon: Icon, color } = providerConfig[provider as keyof typeof providerConfig];
                return (
                  <SelectItem 
                    key={provider} 
                    value={provider} 
                    className="hover:bg-blue-50/80 transition-all duration-200 rounded-lg
                      flex items-center cursor-pointer px-2 py-1.5 sm:py-2.5 group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium">
                      <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg 
                        ${color} p-1 sm:p-1.5
                        group-hover:scale-110 transition-transform duration-300`}>
                        {Icon && <Icon className="w-full h-full" />}
                      </div>
                      <span className="text-gray-700">{provider}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </motion.div>
          </SelectContent>
        </Select>

        {/* Model Selector */}
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger 
            className={`${
              compact 
                ? 'w-[120px] sm:w-[160px]'
                : isChatMode
                  ? 'w-[140px] sm:w-[180px] lg:w-[200px]'
                  : 'w-[160px] sm:w-[200px] lg:w-[240px]'
            } bg-white/10 backdrop-blur-xl 
              border-white/20 
              transition-all duration-300 hover:border-purple-300/50
              focus:border-purple-300/50 focus:ring-0 focus:ring-offset-0 focus:outline-none
              ${isChatMode ? 'rounded-xl' : 'rounded-lg sm:rounded-xl lg:rounded-2xl'}
              shadow-[0_2px_10px_rgba(0,0,0,0.06)]
              hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
              px-2 sm:px-3
              h-8 sm:h-9
              text-[11px] sm:text-xs
              flex items-center`}
          >
            <SelectValue placeholder="Select Model" className="text-gray-600 truncate" />
          </SelectTrigger>
          <SelectContent 
            className={`bg-white/90 backdrop-blur-xl border-gray-200/50 
              rounded-xl
              shadow-lg animate-in fade-in-80 slide-in-from-top-1 
              p-1.5
              max-h-[300px]
              ${isChatMode 
                ? 'w-[200px] sm:w-[250px] lg:w-[300px]'
                : 'w-[220px] sm:w-[280px] lg:w-[320px]'}`}
            position={isChatMode ? "popper" : "item-aligned"}
          >
            <SelectGroup>
              <SelectLabel className="text-[11px] sm:text-xs font-medium text-gray-500 px-2 py-1.5 mb-1">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-lg 
                    ${providerColor} p-1`}>
                    {ProviderIcon && <ProviderIcon className="w-full h-full" />}
                  </div>
                  <span className="truncate">{selectedProvider} Models</span>
                </div>
              </SelectLabel>
              <div className="space-y-0.5">
                {providerModels.map(model => (
                  <SelectItem 
                    key={model.value} 
                    value={model.value} 
                    className="hover:bg-purple-50/80 transition-all duration-200 rounded-lg
                      flex items-center cursor-pointer px-2 py-1.5 group"
                  >
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium w-full">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-lg 
                        ${model.color} p-1
                        group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <Bot className="w-full h-full" />
                      </div>
                      <span className={`transition-colors duration-200 truncate`}>
                        {model.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ModelSelector;