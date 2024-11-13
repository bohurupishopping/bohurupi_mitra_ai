import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define image model types
interface ImageModelOption {
  value: string;
  label: string;
  provider: string;
  color: string;
  description?: string;
}

const IMAGE_MODELS: ImageModelOption[] = [
  { 
    provider: 'Together', 
    value: 'black-forest-labs/FLUX.1-schnell-Free', 
    label: 'FLUX.1 Schnell', 
    color: 'text-orange-600 bg-orange-50',
    description: 'Fast image generation'
  },

  { 
    provider: 'Together', 
    value: 'stabilityai/stable-diffusion-xl-base-1.0', 
    label: 'Stable Diffusion XL', 
    color: 'text-orange-700 bg-orange-50',
    description: 'Professional image generation'
  },
];

interface ModelSelectorImageProps {
  onModelChange?: (model: string) => void;
  compact?: boolean;
}

const ModelSelectorImage: React.FC<ModelSelectorImageProps> = ({ 
  onModelChange, 
  compact 
}) => {
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].value);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    onModelChange?.(model);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger 
          className={`${
            compact 
              ? 'w-[180px] sm:w-[220px] lg:w-[280px]' 
              : 'w-[220px] sm:w-[280px] lg:w-[320px]'
          } bg-white/80 backdrop-blur-xl 
            border-gray-200/50 
            transition-all duration-300 hover:border-blue-300 
            rounded-lg sm:rounded-xl lg:rounded-2xl
            shadow-[0_2px_10px_rgba(0,0,0,0.06)] 
            hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
            px-2 sm:px-2.5 lg:px-4 
            h-8 sm:h-9 lg:h-11 
            text-[11px] sm:text-xs lg:text-sm
            truncate`}
        >
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent 
          className="bg-white/90 backdrop-blur-xl border-gray-200/50 
            rounded-lg sm:rounded-xl
            shadow-lg animate-in fade-in-80 slide-in-from-top-1 
            p-1 sm:p-1.5 lg:p-2
            w-[280px] sm:w-[320px] lg:w-[380px]"
        >
          <SelectGroup>
            <SelectLabel className="text-xs sm:text-sm font-medium text-gray-500 px-2 py-1.5">
              Image Generation Models
            </SelectLabel>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 sm:space-y-1"
            >
              {IMAGE_MODELS.map(model => (
                <SelectItem 
                  key={model.value} 
                  value={model.value} 
                  textValue={model.label}
                  className="hover:bg-blue-50/80 transition-all duration-200 rounded-lg
                    flex items-center cursor-pointer px-2 py-1.5 sm:py-2 group"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 
                        rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 
                        p-1 sm:p-1.5 group-hover:scale-110 transition-transform duration-300"
                      >
                        <ImageIcon className={`w-full h-full ${model.color}`} />
                      </div>
                      <span className={`${model.color} truncate`}>{model.label}</span>
                    </div>
                    {model.description && (
                      <p className="text-[10px] sm:text-xs text-gray-500 ml-8 truncate">
                        {model.description}
                      </p>
                    )}
                  </div>
                </SelectItem>
              ))}
            </motion.div>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelectorImage; 