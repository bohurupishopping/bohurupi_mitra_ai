'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Settings2, Share2, Trash2, Image, Sparkles, Download, RefreshCw, Wand2, X, Copy } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ModelSelectorImage from '@/components/ModelSelectorImage'
import { enhancePrompt } from '@/services/promptEnhancementService'
import { ImageSize } from '@/types/image'
import ImageSettingsPopup from '@/components/ImageSettingsPopup'
import { useToast } from "@/components/ui/use-toast"
import OpenAI from 'openai'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import { ImageHistoryService, ImageSession } from '@/services/imageHistoryService'
import Header from '../components/Header';

// Initialize Together AI client
const togetherClient = new OpenAI({
  apiKey: import.meta.env.VITE_TOGETHER_API_KEY || '',
  baseURL: 'https://api.together.xyz/v1',
  dangerouslyAllowBrowser: true
});

// Add these type definitions at the top of the file
interface GeneratedImage {
  url: string;
  timestamp: string;
  prompt: string;
}

interface ImageMessage {
  type: 'prompt' | 'response';
  content: string;
  timestamp: string;
  imageUrl?: string;
  session_id?: string;
}

interface ImageGenerationParams {
  model: string;
  prompt: string;
  n: number;
  size: ImageSize;
  negative_prompt?: string;
}

// Add this helper function for better prompt formatting
const formatEnhancedPrompt = (
  mainPrompt: string, 
  negativePrompt: string, 
  size: ImageSize
): { prompt: string; negative_prompt: string } => {
  // Enhance positive prompt
  const enhancedPrompt = `
    Create a highly detailed image:
    ${mainPrompt}
    Style: High quality, detailed, sharp focus, high resolution
    Technical details: ${size}, high definition, 8k resolution
  `.trim();

  // Enhance negative prompt
  const enhancedNegativePrompt = `
    low quality, blurry, pixelated, poor composition, 
    bad lighting, distorted proportions, 
    ${negativePrompt}
  `.trim();

  return {
    prompt: enhancedPrompt,
    negative_prompt: enhancedNegativePrompt
  };
};

export default function ImaginePage() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([])
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [selectedModel, setSelectedModel] = useState('black-forest-labs/FLUX.1-schnell-Free');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [dimensions, setDimensions] = useState<ImageSize>("1024x1024");
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [imageMessages, setImageMessages] = useState<ImageMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageHistoryService] = useState(() => new ImageHistoryService());
  const [imageSessions, setImageSessions] = useState<ImageSession[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [imageMessages]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        const history = await imageHistoryService.getImageHistory();
        if (mounted) {
          setImageSessions(history);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading image history:', error);
          toast({
            title: "Error",
            description: "Failed to load image history",
            variant: "destructive",
          });
        }
      }
    };

    loadHistory();
    
    const handleHistoryUpdate = () => {
      if (mounted) {
        loadHistory();
      }
    };

    window.addEventListener('image-history-updated', handleHistoryUpdate);
    
    return () => {
      mounted = false;
      window.removeEventListener('image-history-updated', handleHistoryUpdate);
    };
  }, []);

  const handleDownload = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`,
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Direct download failed');
      }

      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      const contentType = response.headers.get('content-type');
      const extension = contentType?.includes('jpeg') ? 'jpg' : 
                       contentType?.includes('png') ? 'png' : 'jpg';
      
      link.download = `generated-image-${Date.now()}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    } catch (err) {
      console.error('Download error:', err);
      
      try {
        window.open(imageUrl, '_blank');
        toast({
          title: "Alternative Download",
          description: "Image opened in new tab. Right-click to save.",
        });
      } catch (fallbackErr) {
        toast({
          title: "Error",
          description: "Failed to download image. Please try right-clicking the image and selecting 'Save Image As'",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        const imageUrl = (target as HTMLImageElement).src;
        if (imageUrl) {
          handleDownload(imageUrl);
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleDownload]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only reload if necessary, maybe check a timestamp
        const lastUpdate = localStorage.getItem('lastImageUpdate');
        const now = Date.now();
        if (lastUpdate && now - parseInt(lastUpdate) > 300000) { // 5 minutes
          loadImageHistory();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadImageHistory = async () => {
    try {
      const history = await imageHistoryService.getImageHistory();
      setImageSessions(history);
    } catch (error) {
      console.error('Error loading image history:', error);
      toast({
        title: "Error",
        description: "Failed to load image history",
        variant: "destructive",
      });
    }
  };

  // Update the generateImage function
  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const { prompt: enhancedPrompt, negative_prompt: enhancedNegativePrompt } = 
      formatEnhancedPrompt(prompt, negativePrompt, dimensions);

    // Only add prompt message initially
    const promptMessage: ImageMessage = {
      type: 'prompt',
      content: enhancedPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setImageMessages(prev => [...prev, promptMessage]);

    setIsLoading(true);
    setError(null);

    try {
      const params: ImageGenerationParams = {
        model: selectedModel,
        prompt: enhancedPrompt,
        negative_prompt: enhancedNegativePrompt,
        n: 1,
        size: dimensions,
      };

      const response = await togetherClient.images.generate(params);

      if (response.data && response.data[0]?.url) {
        const imageUrl = response.data[0].url;
        
        // Save to history first
        await imageHistoryService.saveImage(
          enhancedPrompt,
          imageUrl,
          enhancedNegativePrompt
        );

        // Then update local state with response message
        const responseMessage: ImageMessage = {
          type: 'response',
          content: enhancedPrompt,
          imageUrl: imageUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setImageMessages(prev => [...prev, responseMessage]);

        // Clear the input fields after successful generation
        setPrompt('');
        setNegativePrompt('');

        toast({
          title: "Image Generated",
          description: "Your image has been created successfully!",
        });

        // Refresh the history
        await loadImageHistory();
      } else {
        throw new Error('No image generated');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const enhancedPrompt = await enhancePrompt(prompt);
      setPrompt(enhancedPrompt);
      toast({
        title: "Prompt Enhanced",
        description: "Your prompt has been enhanced for better results",
      });
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const formatPrompt = (mainPrompt: string, size: ImageSize, negativePrompt?: string): string => {
    const aspectRatio = size.split('x').map(Number);
    const ratio = aspectRatio[0] / aspectRatio[1];
    let ratioDescription = '1:1 square';
    
    if (ratio > 1) {
      ratioDescription = '16:9 landscape';
    } else if (ratio < 1) {
      ratioDescription = '9:16 portrait';
    }

    let formattedPrompt = `${mainPrompt}\nFollow <Image Dimensions: ${size} (${ratioDescription})>`;
    
    if (negativePrompt?.trim()) {
      formattedPrompt += `\nDo not include these: <${negativePrompt.trim()}>`;
    }

    return formattedPrompt;
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set new height based on scrollHeight
    textarea.style.height = `${textarea.scrollHeight}px`;
    setPrompt(e.target.value);
  };

  // Add this function to handle negative prompt changes
  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
  };

  const handleDeleteImage = async (sessionId: string) => {
    try {
      await imageHistoryService.deleteImage(sessionId);
      toast({
        title: "Image Deleted",
        description: "Image has been permanently deleted",
      });
      await loadImageHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const trackUpdate = () => {
    localStorage.setItem('lastImageUpdate', Date.now().toString());
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
         

          {/* Display generated images with enhanced design */}
          <div className="flex-1 overflow-y-auto p-4 relative">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-blue-50/40 dark:from-gray-900/40 dark:to-blue-900/40 animate-gradient-xy"></div>

            <div className="relative z-10">
              {imageMessages.length === 0 && imageSessions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-1 flex-col items-center justify-center gap-6 p-8"
                >
                  <div className="rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-6 shadow-lg
                    group hover:shadow-xl transition-all duration-500 cursor-pointer
                    hover:scale-110 transform"
                  >
                    <Image className="size-12 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 
                      bg-clip-text text-transparent">
                      No creations yet
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-300 max-w-md">
                      Start creating amazing content with Imagine's AI-powered tools.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 
                  gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6">
                  {/* Show only history images */}
                  {imageSessions.map((session, index) => (
                    <motion.div
                      key={`history-${session.session_id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-300 to-blue-300 
                        dark:from-purple-600 dark:to-blue-600 rounded-[1.5rem] sm:rounded-[2rem] blur opacity-30 
                        group-hover:opacity-60 transition duration-500">
                      </div>
                      <div className="relative rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden 
                        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 sm:p-3 shadow-lg hover:shadow-xl 
                        transition-all duration-300 cursor-pointer
                        border border-white/50 dark:border-gray-700/50"
                        onClick={() => {
                          setSelectedImage(session.image_url)
                          setIsImageModalOpen(true)
                        }}
                      >
                        <div className="aspect-square rounded-2xl overflow-hidden">
                          <img 
                            src={session.image_url} 
                            alt="Generated" 
                            className="w-full h-full object-cover transform 
                              transition-transform duration-500 
                              group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="absolute inset-3 rounded-2xl bg-gradient-to-t 
                          from-black/80 via-black/20 to-transparent opacity-0 
                          group-hover:opacity-100 transition-all duration-300
                          flex flex-col justify-end p-4 gap-3"
                        >
                          <div className="text-white/90 text-sm line-clamp-3 
                            backdrop-blur-sm bg-black/20 rounded-xl p-3">
                            {session.last_prompt}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 rounded-xl
                                shadow-lg hover:shadow-xl transition-all duration-200
                                transform hover:-translate-y-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(session.last_prompt);
                                toast({
                                  title: "Copied",
                                  description: "Prompt copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 rounded-xl
                                shadow-lg hover:shadow-xl transition-all duration-200
                                transform hover:-translate-y-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(session.image_url);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-red-500/90 hover:bg-red-500 rounded-xl
                                shadow-lg hover:shadow-xl transition-all duration-200
                                transform hover:-translate-y-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(session.session_id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 px-1">
                          <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Creation Interface */}
          <div className="border-t bg-transparent p-2 sm:p-4">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={generateImage} className="space-y-4">
                {/* Main Input with Glassmorphism */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-300">
                  </div>
                  <div className="relative rounded-[2.5rem] overflow-hidden 
                    bg-white/10 backdrop-blur-md border border-white/20 
                    shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <textarea
                      value={prompt}
                      onChange={handleTextareaInput}
                      className="w-full min-h-[60px] max-h-[200px] px-6 py-4 text-base
                        bg-transparent border-none focus:outline-none focus:ring-0
                        placeholder:text-gray-400 resize-none"
                      placeholder="Describe what you want in the image..."
                      style={{ height: 'auto' }}
                    />
                    
                    {/* Controls Row */}
                    <div className="flex items-center justify-between p-3 
                      border-t border-white/10 bg-white/5">
                      
                      {/* Left Side Controls */}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl hover:bg-white/10 transition-all duration-300
                                flex items-center gap-2 text-sm"
                            >
                              <Settings2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Settings</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-64 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg
                              rounded-xl border border-white/20 shadow-xl"
                            align="start"
                          >
                            {/* Negative Prompt */}
                            <div className="space-y-2 mb-4">
                              <label className="text-sm font-medium">Negative Prompt</label>
                              <textarea
                                value={negativePrompt}
                                onChange={(e) => handleNegativePromptChange(e.target.value)}
                                className="w-full min-h-[80px] p-2 text-sm rounded-lg
                                  bg-white/50 dark:bg-gray-700/50 border border-gray-200/50
                                  focus:outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="What you DON'T want..."
                              />
                            </div>

                            {/* Image Size Selection */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Image Size</label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={dimensions === "1024x1024" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setDimensions("1024x1024")}
                                  className="flex-1 rounded-lg transition-all duration-300"
                                >
                                  1:1
                                </Button>
                                <Button
                                  type="button"
                                  variant={dimensions === "1792x1024" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setDimensions("1792x1024")}
                                  className="flex-1 rounded-lg transition-all duration-300"
                                >
                                  16:9
                                </Button>
                                <Button
                                  type="button"
                                  variant={dimensions === "1024x1792" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setDimensions("1024x1792")}
                                  className="flex-1 rounded-lg transition-all duration-300"
                                >
                                  9:16
                                </Button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          type="button"
                          onClick={handleEnhancePrompt}
                          disabled={!prompt.trim() || isEnhancing}
                          variant="ghost"
                          size="sm"
                          className="rounded-xl hover:bg-white/10 transition-all duration-300
                            group/enhance"
                        >
                          {isEnhancing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4 group-hover/enhance:scale-110 
                              transition-transform duration-300" />
                          )}
                          <span className="hidden sm:inline ml-2">Enhance</span>
                        </Button>
                      </div>

                      {/* Create Button */}
                      <Button 
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                          hover:from-purple-600 hover:to-blue-600 text-white
                          shadow-lg hover:shadow-xl transition-all duration-300
                          transform hover:-translate-y-0.5 hover:scale-105
                          px-6 py-2 text-sm font-medium"
                      >
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          <span>{isLoading ? "Creating..." : "Create"}</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Clean Image Modal with zoom option */}
          <AnimatePresence>
            {isImageModalOpen && selectedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-50 
                  backdrop-blur-lg
                  flex items-center justify-center p-4 cursor-zoom-in"
                onClick={() => setIsImageModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="relative max-w-4xl w-full"
                  onClick={e => e.stopPropagation()}
                >
                  <img 
                    src={selectedImage} 
                    alt="Full size"
                    className="w-full h-auto rounded-lg transform transition-transform duration-300 hover:scale-105"
                  />
                  
                  {/* Minimal close button */}
                  <Button
                    onClick={() => setIsImageModalOpen(false)}
                    variant="ghost"
                    className="absolute top-4 right-4 text-white/80 hover:text-white
                      hover:bg-black/20 rounded-full w-8 h-8 p-0
                      backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}