"use client";

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/FLUX.1-schnell-Free');

  const models = [
    {
      id: 'black-forest-labs/FLUX.1-schnell-Free',
      name: 'FLUX.1 Schnell',
    },
    {
      id: 'stabilityai/stable-diffusion-xl-base-1.0',
      name: 'Stable Diffusion XL',
    }
  ];

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onModelChange(modelId);
  };

  const selectedModelData = models.find(model => model.id === selectedModel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-3 py-2 
            bg-white/10 backdrop-blur-md border border-white/20
            hover:bg-white/20 transition-all duration-300
            rounded-xl text-sm font-medium text-gray-700
            shadow-sm hover:shadow-md"
        >
          <span className="text-sm font-medium">{selectedModelData?.name}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-xl bg-white/90 backdrop-blur-xl
          border-white/20 shadow-lg"
      >
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleModelSelect(model.id)}
            className="flex items-center justify-between px-3 py-2
              text-sm cursor-pointer hover:bg-gray-100/50
              transition-colors duration-200"
          >
            <span className="font-medium">{model.name}</span>
            {selectedModel === model.id && (
              <Check className="h-4 w-4 text-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 