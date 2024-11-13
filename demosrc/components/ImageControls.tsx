import React from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, MinusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageSize } from '@/types/image';

interface ImageControlsProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  dimensions: ImageSize;
  onDimensionsChange: (dimensions: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
  showNegativePrompt: boolean;
  onToggleNegativePrompt: () => void;
}

const IMAGE_DIMENSIONS: { value: ImageSize; label: string }[] = [
  { value: "1024x1024", label: '1:1 Square' },
  { value: "1792x1024", label: '16:9 Landscape' },
  { value: "1024x1792", label: '9:16 Portrait' },
];

const ImageControls: React.FC<ImageControlsProps> = ({
  selectedModel,
  onModelChange,
  dimensions,
  onDimensionsChange,
  negativePrompt,
  onNegativePromptChange,
  showNegativePrompt,
  onToggleNegativePrompt,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/50 rounded-xl border border-white/20">
      <Select value={dimensions} onValueChange={onDimensionsChange}>
        <SelectTrigger className="w-[140px] bg-white/80">
          <SelectValue placeholder="Dimensions" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Image Dimensions</SelectLabel>
            {IMAGE_DIMENSIONS.map((dim) => (
              <SelectItem key={dim.value} value={dim.value}>
                {dim.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleNegativePrompt}
        className={`gap-2 ${showNegativePrompt ? 'bg-red-50 text-red-600' : ''}`}
      >
        <MinusCircle className="w-4 h-4" />
        Negative Prompt
      </Button>

      {showNegativePrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full mt-2"
        >
          <Textarea
            placeholder="Enter negative prompt (what you don't want in the image)"
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </motion.div>
      )}
    </div>
  );
};

export default ImageControls; 