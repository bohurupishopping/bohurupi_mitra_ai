"use client";

import { useState, Suspense, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImageIcon, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Sidebar from '@/components/shared/Sidebar';
import ModelSelector from '@/components/imagine/ModelSelector';
import Image from 'next/image';
import ImagePreview from '@/components/imagine/ImagePreview';
import SizeSelector from '@/components/imagine/SizeSelector';
import { ImageHistoryService, type ImageSession } from '@/services/imageHistoryService';

function ImagineContent() {
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
  const imageHistoryServiceRef = useRef(ImageHistoryService.getInstance());
  const [historyImages, setHistoryImages] = useState<ImageSession[]>([]);
  const [selectedImagePrompt, setSelectedImagePrompt] = useState<string>('');

  useEffect(() => {
    loadImageHistory();
    
    const handleHistoryUpdate = () => {
      loadImageHistory();
    };
    
    window.addEventListener('image-history-updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('image-history-updated', handleHistoryUpdate);
    };
  }, []);

  const loadImageHistory = async () => {
    try {
      const history = await imageHistoryServiceRef.current.getImageHistory();
      setHistoryImages(history);
    } catch (error) {
      console.error('Error loading image history:', error);
      toast({
        title: "Error",
        description: "Failed to load image history",
        variant: "destructive",
      });
    }
  };

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
        const imageUrl = data.data[0].url;
        setGeneratedImage(imageUrl);
        
        await imageHistoryServiceRef.current.saveImage(prompt, imageUrl);
        await loadImageHistory();
        
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

  const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await imageHistoryServiceRef.current.deleteImage(id);
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-[100dvh] flex flex-col overflow-hidden 
          px-3 sm:px-4 md:px-6 lg:px-8 py-0 sm:p-1 
          w-full max-w-[1600px] mx-auto">
          <Card className="flex-1 mx-0.5 my-0.5 sm:m-2 
            bg-white/60 backdrop-blur-[12px] 
            rounded-2xl sm:rounded-[2rem] 
            border border-white/20 
            shadow-[0_8px_40px_rgba(0,0,0,0.08)] 
            relative flex flex-col overflow-hidden
            w-full max-w-[1400px] mx-auto
            h-[calc(100dvh-20px)] sm:h-[calc(98dvh-16px)]
            transition-all duration-500 ease-out">
            
            <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem]">
              <motion.div 
                className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] 
                  bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 
                  blur-2xl opacity-40"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative z-10
              scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent
              scroll-smooth">
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden
                      shadow-lg bg-white/50 backdrop-blur-sm border border-white/20
                      flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-8 h-8 text-gray-400" />
                    </motion.div>
                  </motion.div>
                )}
                
                <AnimatePresence mode="popLayout">
                  {generatedImages.map((imageUrl, index) => (
                    <motion.div
                      key={`generated-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                      className="relative aspect-square rounded-2xl overflow-hidden
                        shadow-lg hover:shadow-xl transition-all duration-300
                        bg-white/50 backdrop-blur-sm border border-white/20
                        cursor-pointer group"
                      onClick={() => {
                        setSelectedImage(imageUrl);
                        setSelectedImagePrompt(prompt);
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Generated image ${index + 1}`}
                        fill
                        priority={index < 4}
                        className="object-cover transform transition-all duration-500
                          group-hover:scale-[1.02] will-change-transform"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent 
                        to-black/20 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300" />
                    </motion.div>
                  ))}

                  {historyImages.map((imageSession, index) => (
                    <motion.div
                      key={`history-${imageSession.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                      className="relative aspect-square rounded-2xl overflow-hidden
                        shadow-lg hover:shadow-xl transition-all duration-300
                        bg-white/50 backdrop-blur-sm border border-white/20
                        cursor-pointer group"
                      onClick={() => {
                        setSelectedImage(imageSession.image_url);
                        setSelectedImagePrompt(imageSession.prompt);
                      }}
                    >
                      <Image
                        src={imageSession.image_url}
                        alt={`History image ${index + 1}`}
                        fill
                        priority={index < 4}
                        className="object-cover transform transition-all duration-500
                          group-hover:scale-[1.02] will-change-transform"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent 
                        to-black/20 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300" />
                      
                      <motion.div 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                          transition-all duration-300 transform translate-y-2 
                          group-hover:translate-y-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600 
                            backdrop-blur-sm shadow-lg"
                          onClick={(e) => handleDeleteImage(imageSession.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-2 sm:p-4
              transition-all duration-300">
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
                        [&:not(:focus)]:border-none [&:not(:focus)]:ring-0
                        focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{ 
                        height: '60px',
                        overflowY: 'auto'
                      }}
                    />
                    
                    <div className="flex items-center justify-between p-3 
                      border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-3">
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
                            px-4 py-2 text-sm font-medium relative overflow-hidden"
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
                            <span>
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
            prompt={selectedImagePrompt}
            onClose={() => {
              setSelectedImage(null);
              setSelectedImagePrompt('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ImaginePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[100dvh] items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50/50 to-pink-50/50">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    }>
      <ImagineContent />
    </Suspense>
  );
} 