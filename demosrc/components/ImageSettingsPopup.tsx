import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Sliders, MinusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ImageSize } from '@/types/image';

interface ImageSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dimensions: ImageSize;
  onDimensionsChange: (dimensions: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
}

const IMAGE_DIMENSIONS: { value: ImageSize; label: string }[] = [
  { value: "1024x1024", label: '1:1 Square' },
  { value: "1792x1024", label: '16:9 Landscape' },
  { value: "1024x1792", label: '9:16 Portrait' },
];

const ImageSettingsPopup: React.FC<ImageSettingsPopupProps> = ({
  isOpen,
  onClose,
  dimensions,
  onDimensionsChange,
  negativePrompt,
  onNegativePromptChange,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
            className="bg-gradient-to-br from-white to-blue-50/90 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50"
          >
            <div className="p-6 border-b border-blue-100/50 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-blue-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                      <Sliders className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Image Settings
                    </h2>
                    <p className="text-sm text-gray-500">Configure your image generation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Image Dimensions
                </label>
                <Select value={dimensions} onValueChange={onDimensionsChange}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm hover:border-blue-300 transition-colors duration-200">
                    <SelectValue placeholder="Select dimensions" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 bg-white/90 backdrop-blur-md">
                    {IMAGE_DIMENSIONS.map((dim) => (
                      <SelectItem key={dim.value} value={dim.value}>
                        {dim.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Negative Prompt
                  <MinusCircle className="w-4 h-4 text-red-500" />
                </label>
                <Textarea
                  placeholder="Describe what you don't want in the image..."
                  value={negativePrompt}
                  onChange={(e) => onNegativePromptChange(e.target.value)}
                  rows={4}
                  className="rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm hover:border-blue-300 transition-colors duration-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageSettingsPopup; 