"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, Settings, MoreVertical, X, Copy, Check, Trash2, Save, BookOpen, Upload, Image as ImageIcon, File, RefreshCw, LineChart, BarChart4, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ConversationService } from '@/services/conversationService';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import { useAIGeneration } from './logic-ai-generation';
import { StoryCreationPopup } from './StoryCreationPopup';
import { StoryRewriterPopup } from './StoryRewriterPopup';
import { ChatMessage } from '@/services/conversationService';
import { SEOOptimizerPopup } from './SEOOptimizerPopup';
import { uploadAttachment } from '@/utils/attachmentUtils';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  attachments?: string[];
}

interface ChatInterfaceProps {
  defaultMessage?: string;
  sessionId?: string;
  onModelChange?: (model: string) => void;
}

interface FileUpload {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
  uploading: boolean;
  url?: string;
  path?: string;
}

const stripHtmlAndFormatText = (html: string): string => {
  if (!html.includes('<')) return html;

  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      let text = Array.from(node.childNodes)
        .map(child => processNode(child))
        .join('');
      
      switch (element.tagName.toLowerCase()) {
        case 'h1': return `\n# ${text}\n`;
        case 'h2': return `\n## ${text}\n`;
        case 'h3': return `\n### ${text}\n`;
        case 'p': return `\n${text}\n`;
        case 'li': return `\n• ${text}`;
        case 'ul': return `\n${text}\n`;
        case 'ol': return `\n${text}\n`;
        case 'code': return `\`${text}\``;
        case 'pre': return `\n\`\`\`\n${text}\n\`\`\`\n`;
        case 'blockquote': return `\n> ${text}\n`;
        case 'br': return '\n';
        case 'div': return `\n${text}\n`;
        default: return text;
      }
    }
    return '';
  };
  
  let text = processNode(temp)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
  
  return text;
};

// Update the message container and text styling
const messageContainerStyles = `flex-1 overflow-y-auto
  scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10
  scrollbar-track-transparent 
  hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20
  motion-safe:transition-colors motion-safe:duration-200 
  scroll-smooth overscroll-y-contain momentum-scroll
  [-webkit-overflow-scrolling:touch]
  [scroll-behavior:smooth]
  will-change-scroll
  px-2 sm:px-4 py-2 sm:py-4 
  space-y-2.5 sm:space-y-3.5 
  relative z-10`;

// Update the message styles with enhanced glassmorphism
const messageStyles = {
  user: `bg-gradient-to-br from-blue-500/90 to-blue-600/90 
    text-[0.925rem] sm:text-base leading-relaxed
    shadow-lg hover:shadow-xl transition-all duration-300
    text-white/95 backdrop-blur-md
    border border-blue-400/30
    dark:from-blue-600/80 dark:to-blue-700/80 
    dark:border-blue-500/20`,
  assistant: `bg-white/50 backdrop-blur-xl 
    text-[0.925rem] sm:text-base leading-relaxed
    border border-white/30 text-gray-800
    shadow-sm hover:shadow-md transition-all duration-300
    dark:bg-white/10 dark:border-white/10 dark:text-gray-100
    hover:bg-white/60 dark:hover:bg-white/15
    motion-safe:transition-[background,border,shadow] motion-safe:duration-300`
};

// Update the typing effect utilities
const typeText = async (
  text: string, 
  callback: (partial: string) => void, 
  speed: number = 1.5
) => {
  let partial = '';
  const tokens = text.split(/(\s+|\n|#{1,3}\s|`{1,3}|\*{1,2}|>|-)/).filter(Boolean);
  let buffer = '';
  let lastUpdate = performance.now();
  const updateThreshold = 1000 / 144; // 120fps for ultra-smooth updates

  const processChunk = async (startIndex: number, chunkSize: number) => {
    const endIndex = Math.min(startIndex + chunkSize, tokens.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const token = tokens[i];
      partial += token;
      buffer += token;
      
      const now = performance.now();
      if (now - lastUpdate >= updateThreshold) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        callback(partial);
        buffer = '';
        lastUpdate = now;
      }
    }

    if (endIndex < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
      return processChunk(endIndex, chunkSize);
    }
  };

  await processChunk(0, 5); // Process 5 tokens at a time for better performance
  
  if (buffer) {
    callback(partial);
  }
};

// Update the message animation for smoother transitions
const messageAnimation = {
  initial: { 
    opacity: 0, 
    y: 10, 
    scale: 0.98 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 0.8,
      velocity: 2
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
} as const;

function ChatInterface({ defaultMessage, sessionId, onModelChange }: ChatInterfaceProps) {
  const [conversationService] = useState(() => new ConversationService(sessionId));
  const { selectedModel, setSelectedModel, generateContent } = useAIGeneration({ 
    conversationService,
    defaultModel: 'groq'
  });
  
  // When model changes, notify parent if callback exists
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (onModelChange) {
      onModelChange(model);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: defaultMessage || "# Hello! 👋\n\nI'm your AI assistant. How can I help you today?"
  }]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [isStoryRewriterOpen, setIsStoryRewriterOpen] = useState(false);
  const [isSEOOptimizerOpen, setIsSEOOptimizerOpen] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: 'smooth',
        block: 'end',
      };
      
      // Add a small delay to ensure smooth scrolling after content renders
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView(scrollOptions);
      }, 100);
    }
  }, [messages]);

  // Add new effect to load chat history when sessionId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (sessionId) {
        try {
          const history = await conversationService.loadChatSession(sessionId);
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          toast({
            title: "Error",
            description: "Failed to load chat history",
            variant: "destructive",
          });
        }
      }
    };

    loadChatHistory();
  }, [sessionId, conversationService]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileUpload[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type and size
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit`,
          variant: "destructive"
        });
        continue;
      }

      const isImage = file.type.startsWith('image/');
      
      const attachment: FileUpload = {
        id: uuidv4(),
        file,
        type: isImage ? 'image' : 'document',
        uploading: true
      };

      if (isImage) {
        attachment.preview = URL.createObjectURL(file);
      }

      newAttachments.push(attachment);
    }

    setAttachments(prev => [...prev, ...newAttachments]);

    // Upload files to Supabase
    try {
      for (const attachment of newAttachments) {
        const { url, path } = await uploadAttachment(attachment.file);
        
        // Update attachment with URL and path
        setAttachments(prev => prev.map(att => 
          att.id === attachment.id 
            ? { ...att, url, path, uploading: false }
            : att
        ));
      }
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload one or more files",
        variant: "destructive"
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      prev.forEach(att => {
        if (att.id === id && att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });
      return updated;
    });
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    setSearchQuery('');
  };

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = async (text: string, index: number) => {
    try {
      const formattedText = stripHtmlAndFormatText(text);
      await navigator.clipboard.writeText(formattedText);
      setCopiedIndex(index);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying manually",
        variant: "destructive",
      });
    }
  };

  // Update the handleSubmit function with optimized animation handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;

    const attachmentUrls = attachments
      .filter(att => att.url)
      .map(att => att.url as string);

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      attachments: attachmentUrls
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await generateContent(prompt);
      
      if (response) {
        const tempMessage: Message = {
          role: 'assistant',
          content: ''
        };
        
        setMessages(prev => [...prev, tempMessage]);
        
        // Optimized animation frame handling
        let lastFrameTime = performance.now();
        let animationFrameId: number | undefined;

        const updateMessage = (partial: string) => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }

          animationFrameId = requestAnimationFrame(() => {
            const currentTime = performance.now();
            if (currentTime - lastFrameTime >= 8) { // ~120fps
              setMessages(prev => [
                ...prev.slice(0, -1),
                {
                  role: 'assistant',
                  content: partial
                }
              ]);
              lastFrameTime = currentTime;
            }
          });
        };

        await typeText(response, updateMessage);

        // Cleanup
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        await conversationService.saveConversation(prompt, response);
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setAttachments([]);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden 
      px-2 sm:px-4 md:px-6 lg:px-8 py-0 sm:p-1 
      w-full max-w-[1600px] mx-auto">
      <Card className="flex-1 mx-0.5 my-0.5 sm:m-2 
        bg-white/40 dark:bg-gray-900/40 
        backdrop-blur-[20px] 
        rounded-2xl sm:rounded-[2rem] 
        border border-white/20 dark:border-white/10 
        shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)]
        relative flex flex-col overflow-hidden
        w-full max-w-[1400px] mx-auto
        h-[calc(100dvh-20px)] sm:h-[calc(98dvh-16px)]
        motion-safe:transition-all motion-safe:duration-300">
        
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem]">
          <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] 
            bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 
            dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20
            blur-2xl opacity-50 animate-gradient-x
            motion-safe:transition-opacity motion-safe:duration-500">
          </div>
        </div>

        <CardHeader 
          className="border-b border-white/20 dark:border-white/10 
            px-2 sm:px-6 py-1.5 sm:py-3
            flex flex-row justify-between items-center 
            bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl
            relative z-10
            h-auto sm:h-auto flex-shrink-0
            motion-safe:transition-colors motion-safe:duration-300"
        >
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6 sm:w-10 sm:h-10">
              <AvatarImage src="/assets/ai.png" alt="AI Avatar" />
            </Avatar>
            <span className="font-medium text-xs sm:text-base hidden sm:inline">Bohurupi AI : Your Personalized AI Assistant</span>
            <span className="font-medium text-xs sm:hidden">Bohurupi AI</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-red-50 group"
                    onClick={async () => {
                      try {
                        // Show confirmation dialog
                        if (window.confirm('Are you sure you want to clear this chat?')) {
                          // Clear messages from UI
                          setMessages([{
                            role: 'assistant',
                            content: "# Hello! 👋\n\nI'm your AI assistant. How can I help you today?"
                          }]);

                          // If we have a sessionId, only delete that specific session
                          if (sessionId) {
                            await conversationService.deleteChatSession(sessionId);
                            toast({
                              title: "Chat Cleared",
                              description: "This chat session has been cleared successfully.",
                              duration: 3000,
                            });
                          } else {
                            // If no sessionId (new chat), just clear the UI
                            toast({
                              title: "Chat Cleared",
                              description: "Messages have been cleared from this chat.",
                              duration: 3000,
                            });
                          }

                          // Dispatch event to update any other components
                          window.dispatchEvent(new CustomEvent('chat-updated'));
                        }
                      } catch (error) {
                        console.error('Error clearing chat:', error);
                        toast({
                          title: "Error",
                          description: "Failed to clear chat. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={toggleSearch}>
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={() => setIsStoryCreatorOpen(true)}>
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={() => setIsStoryRewriterOpen(true)}>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={() => setIsSEOOptimizerOpen(true)}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0 
          h-[calc(100dvh-60px)] sm:h-[calc(94dvh-100px)]">
          
          {isSearching && (
            <div className="p-2 sm:p-3 border-b border-white/20 bg-white/40 backdrop-blur-[10px] flex-shrink-0">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={toggleSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className={messageContainerStyles}>
            <AnimatePresence mode="popLayout">
              {(searchQuery ? filteredMessages : messages).map((message, index) => (
                <motion.div
                  key={index}
                  {...messageAnimation}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} 
                    transform-gpu will-change-transform
                    group/message`}
                >
                  <div className={`flex items-start space-x-1.5 sm:space-x-2 
                    max-w-[88%] sm:max-w-[80%] lg:max-w-[75%]
                    ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}
                    group-hover/message:translate-y-[-1px] transition-transform duration-200`}>
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 mt-0.5 flex-shrink-0">
                      <AvatarImage 
                        src={message.role === 'user' ? "/assets/pritam-img.png" : "/assets/ai-icon.png"} 
                        alt={message.role === 'user' ? "User" : "AI"}
                        className="object-cover"
                      />
                    </Avatar>
                    
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-2xl 
                        break-words overflow-hidden
                        ${messageStyles[message.role]}`}
                    >
                      <div className="overflow-x-auto">
                        {message.role === 'user' ? (
                          <div className="leading-relaxed">
                            {message.content}
                          </div>
                        ) : (
                          <ReactMarkdown
                            components={{
                              pre: ({ node, ...props }) => (
                                <div className="overflow-x-auto max-w-full my-2">
                                  <pre {...props} className="p-3 rounded-xl bg-black/5 
                                    text-[0.85rem] sm:text-[0.925rem] leading-relaxed" />
                                </div>
                              ),
                              code: ({ node, ...props }) => (
                                <code {...props} className="break-words sm:break-normal 
                                  text-[0.85rem] sm:text-[0.925rem] leading-relaxed" />
                              ),
                              p: ({ node, ...props }) => (
                                <p {...props} className="break-words mb-2 last:mb-0" />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul {...props} className="list-disc pl-4 mb-2 space-y-1" />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol {...props} className="list-decimal pl-4 mb-2 space-y-1" />
                              ),
                              li: ({ node, ...props }) => (
                                <li {...props} className="mb-1 last:mb-0" />
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      <div className="flex justify-end mt-1.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-5 w-5 rounded-full 
                                  ${message.role === 'user' 
                                    ? 'text-white/70 hover:text-white hover:bg-white/10' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                  } active:scale-95 transition-all duration-200`}
                                onClick={() => copyToClipboard(message.content, index)}
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedIndex === index ? 'Copied!' : 'Copy message'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-2 px-4 py-3 rounded-xl 
                  bg-white/60 backdrop-blur-xl border border-white/30
                  shadow-sm transition-all duration-300">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, repeatDelay: 0.1 }}
                    className="w-2 h-2 bg-blue-500/80 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.2, repeatDelay: 0.1 }}
                    className="w-2 h-2 bg-blue-500/80 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.4, repeatDelay: 0.1 }}
                    className="w-2 h-2 bg-blue-500/80 rounded-full"
                  />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} className="scroll-mt-[100px]" />
          </div>

          <div className="border-t bg-transparent p-2 sm:p-4">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    dark:from-purple-400/30 dark:to-blue-400/30
                    rounded-[2rem] blur opacity-75 group-hover:opacity-100 
                    motion-safe:transition-opacity motion-safe:duration-300">
                  </div>
                  <div className="relative rounded-[2.5rem] overflow-hidden 
                    bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl 
                    border border-white/20 dark:border-white/10 
                    shadow-lg group-hover:shadow-xl 
                    motion-safe:transition-all motion-safe:duration-300">
                    
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200/30">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="relative group/attachment">
                            {attachment.type === 'image' && attachment.preview && (
                              <img 
                                src={attachment.preview} 
                                alt="Attachment preview" 
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            {attachment.type === 'document' && (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <File className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            {attachment.uploading && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-white animate-spin" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeAttachment(attachment.id)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/attachment:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full min-h-[60px] max-h-[200px] px-6 py-4 text-base
                        bg-transparent border-none focus:outline-none focus:ring-0
                        placeholder:text-gray-400 resize-none selection:bg-blue-200/30
                        [&:not(:focus)]:border-none [&:not(:focus)]:ring-0
                        focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{ 
                        height: 'auto',
                        overflowY: 'auto',
                        lineHeight: '1.5'
                      }}
                    />
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 
                      border-t border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl hover:bg-white/10 transition-all duration-300
                            flex items-center gap-2 text-sm group/attach"
                        >
                          <ImageIcon className="w-4 h-4 group-hover/attach:scale-110 
                            transition-transform duration-300" />
                          <span className="hidden sm:inline">Attach</span>
                        </Button>

                        <ModelSelector 
                          onModelChange={handleModelChange}
                          compact={true}
                          isChatMode={true}
                        />

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                      </div>

                      <Button 
                        type="submit"
                        disabled={!prompt.trim() && attachments.length === 0 || isLoading}
                        className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                          hover:from-purple-600 hover:to-blue-600 text-white
                          shadow-lg hover:shadow-xl transition-all duration-300
                          transform hover:-translate-y-0.5 hover:scale-105
                          px-3 sm:px-5 py-2 text-sm font-medium
                          mr-2 sm:mr-3"
                      >
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span className="text-xs sm:text-sm">
                            {isLoading ? "Sending..." : "Send"}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
      <>
        <StoryCreationPopup 
          isOpen={isStoryCreatorOpen}
          onClose={() => setIsStoryCreatorOpen(false)}
          onSubmit={(prompt: string) => {
            setPrompt(prompt);
            handleSubmit(new Event('submit') as any);
          }}
        />
        <StoryRewriterPopup
          isOpen={isStoryRewriterOpen}
          onClose={() => setIsStoryRewriterOpen(false)}
          onSubmit={(prompt: string) => {
            setPrompt(prompt);
            handleSubmit(new Event('submit') as any);
          }}
        />
        <SEOOptimizerPopup
          isOpen={isSEOOptimizerOpen}
          onClose={() => setIsSEOOptimizerOpen(false)}
          onSubmit={(prompt: string) => {
            setPrompt(prompt);
            handleSubmit(new Event('submit') as any);
          }}
        />
      </>
    </div>
  );
}

export default React.memo(ChatInterface);