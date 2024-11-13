"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Sidebar from '@/components/shared/Sidebar';
import ModelSelector from '@/components/imagine/ModelSelector';
import Image from 'next/image';
import ImagePreview from '@/components/imagine/ImagePreview';
import SizeSelector from '@/components/imagine/SizeSelector';

export default function ImaginePage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/FLUX.1-schnell-Free');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const { toast } = useToast();

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        toast({
          title: "Prompt Enhanced",
          description: "Your prompt has been enhanced for better results",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enhance prompt",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/imagine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          size: selectedSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.data[0]?.url) {
        setGeneratedImages(prev => [data.data[0].url, ...prev]);
        setGeneratedImage(data.data[0].url);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error('No image URL received');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-[100dvh] flex flex-col overflow-hidden 
          px-3 sm:px-4 md:px-6 lg:px-8 py-0 sm:p-1 
          w-full max-w-[1600px] mx-auto">
          <Card className="flex-1 mx-0.5 my-0.5 sm:m-2 
            bg-white/60 backdrop-blur-[10px] 
            rounded-lg sm:rounded-[2rem] 
            border border-white/20 
            shadow-[0_8px_32px_rgba(0,0,0,0.12)] 
            relative flex flex-col overflow-hidden
            w-full max-w-[1400px] mx-auto
            h-[calc(100dvh-20px)] sm:h-[calc(98dvh-16px)]"
          >
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative aspect-square rounded-xl overflow-hidden
                      shadow-lg bg-white/50 backdrop-blur-sm border border-white/20
                      flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  </motion.div>
                )}
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden
                      shadow-lg hover:shadow-xl transition-all duration-300
                      bg-white/50 backdrop-blur-sm border border-white/20
                      cursor-pointer group"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image}
                      alt={`Generated image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t bg-white/10 p-4">
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="relative group">
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                      rounded-[2rem] blur"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: isEnhancing ? 1 : 0.75 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="relative rounded-[2.5rem] overflow-hidden 
                    bg-white/10 backdrop-blur-md border border-white/20 
                    shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        // Improved auto-resize logic
                        e.target.style.height = 'inherit';
                        const computed = window.getComputedStyle(e.target);
                        const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                                      + parseInt(computed.getPropertyValue('padding-top'), 10)
                                      + e.target.scrollHeight
                                      + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                                      + parseInt(computed.getPropertyValue('border-bottom-width'), 10);

                        e.target.style.height = `${Math.min(height, 200)}px`;
                      }}
                      placeholder="Describe the image you want to generate..."
                      className="w-full min-h-[60px] max-h-[200px] px-6 py-4 text-base
                        bg-transparent border-none focus:outline-none focus:ring-0
                        placeholder:text-gray-400 resize-none selection:bg-blue-200/30
                        transition-all duration-300 ease-in-out
                        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                      style={{ 
                        height: '60px',
                        overflowY: 'auto'
                      }}
                    />
                    
                    <div className="flex items-center justify-between p-3 
                      border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        <ModelSelector onModelChange={setSelectedModel} />
                        <SizeSelector onSizeChange={setSelectedSize} />
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleEnhancePrompt}
                            disabled={!prompt.trim() || isEnhancing}
                            className="flex items-center gap-2 rounded-xl relative overflow-hidden"
                          >
                            <motion.div
                              animate={{
                                rotate: isEnhancing ? 360 : 0
                              }}
                              transition={{
                                duration: 2,
                                repeat: isEnhancing ? Infinity : 0,
                                ease: "linear"
                              }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                            <span className="hidden sm:inline">
                              {isEnhancing ? "Enhancing..." : "Enhance"}
                            </span>
                            {isEnhancing && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                                animate={{
                                  x: ["0%", "100%"],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                              />
                            )}
                          </Button>
                        </motion.div>
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit"
                          disabled={!prompt.trim() || isLoading}
                          className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                            hover:from-purple-600 hover:to-blue-600 text-white
                            shadow-lg hover:shadow-xl transition-all duration-300
                            transform hover:-translate-y-0.5 hover:scale-105
                            px-4 sm:px-6 py-2 text-sm font-medium relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{
                                rotate: isLoading ? 360 : 0
                              }}
                              transition={{
                                duration: 2,
                                repeat: isLoading ? Infinity : 0,
                                ease: "linear"
                              }}
                            >
                              {isLoading ? (
                                <RefreshCw className="w-4 h-4" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </motion.div>
                            <span className="hidden sm:inline">
                              {isLoading ? "Generating..." : "Generate"}
                            </span>
                          </div>
                          {isLoading && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                              animate={{
                                x: ["0%", "100%"],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </main>
      <AnimatePresence>
        {selectedImage && (
          <ImagePreview
            src={selectedImage}
            alt="Generated image preview"
            prompt={prompt}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 