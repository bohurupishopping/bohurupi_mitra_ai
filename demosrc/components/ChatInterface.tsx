'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, Settings, MoreVertical, X, Copy, Check, Trash2, Save, BookOpen, Upload, Image as ImageIcon, File, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ConversationService } from '@/services/conversationService'
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import StoryCreationPopup from './StoryCreationPopup'
import StoryRewriterPopup from './StoryRewriterPopup'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wand2 } from 'lucide-react'
import ModelSelector from './ModelSelector'
import { DocumentService } from '@/services/documentService'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  generateContent: (prompt: string) => Promise<string | null>;
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
        case 'h1':
          return `\n# ${text}\n`;
        case 'h2':
          return `\n## ${text}\n`;
        case 'h3':
          return `\n### ${text}\n`;
        case 'p':
          return `\n${text}\n`;
        case 'li':
          return `\n• ${text}`;
        case 'ul':
          return `\n${text}\n`;
        case 'ol':
          return `\n${text}\n`;
        case 'code':
          return `\`${text}\``;
        case 'pre':
          return `\n\`\`\`\n${text}\n\`\`\`\n`;
        case 'blockquote':
          return `\n> ${text}\n`;
        case 'br':
          return '\n';
        case 'div':
          return `\n${text}\n`;
        default:
          return text;
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

export default function ChatInterface({ generateContent, defaultMessage, sessionId, onModelChange }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: defaultMessage || "# Hello, Bohurupi Explorer! 👋\n\nWelcome to a world where conversations come alive! I'm here to assist you with any questions or tasks you may have. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [conversationService] = useState(() => new ConversationService(sessionId));
  const { toast } = useToast();
  const [isStoryPopupOpen, setIsStoryPopupOpen] = useState(false);
  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStoryRewriterPopupOpen, setIsStoryRewriterPopupOpen] = useState(false);
  const [documentService] = useState(() => new DocumentService());

  const handleStorySubmit = async (prompt: string) => {
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await generateContent(prompt);
      
      if (response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMessage]);
        await conversationService.saveConversation(prompt, response);
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (sessionId) {
      loadChatSession(sessionId);
    } else {
      setMessages([{
        role: 'assistant',
        content: defaultMessage || "# Hello, Bohurupi Explorer! 👋\n\nWelcome to a world where conversations come alive! I'm here to assist you with any questions or tasks you may have. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [sessionId, defaultMessage]);

  const loadChatSession = async (sid: string) => {
    try {
      console.log('Loading session:', sid);
      const loadedMessages = await conversationService.loadChatSession(sid);
      console.log('Loaded messages:', loadedMessages);
      
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const buildContextualPrompt = async (newPrompt: string) => {
    try {
      const recentMessages = await conversationService.getRecentConversations(5);
      
      const context = recentMessages
        .reverse()
        .map(msg => `User: ${msg.prompt}\nAssistant: ${msg.response}`)
        .join('\n\n');

      const contextualPrompt = context 
        ? `Previous conversation:\n${context}\n\nUser: ${newPrompt}`
        : newPrompt;

      return contextualPrompt;
    } catch (error) {
      console.error('Error building contextual prompt:', error);
      return newPrompt;
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${sessionId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) {
      throw new Error('Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type === 'application/pdf' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        file.type === 'text/plain';
      
      if (!isImage && !isDocument) continue;

      const attachment: FileUpload = {
        id: Math.random().toString(36).substr(2, 9),
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

    for (const attachment of newAttachments) {
      if (attachment.type === 'document') {
        try {
          const url = await documentService.processDocument(attachment.file, sessionId || '');
          setAttachments(prev => 
            prev.map(att => 
              att.id === attachment.id 
                ? { ...att, uploading: false, url } 
                : att
            )
          );
        } catch (error) {
          console.error('Document processing failed:', error);
          toast({
            title: 'Error',
            description: `Failed to process document: ${attachment.file.name}`,
            variant: 'destructive'
          });
          removeAttachment(attachment.id);
        }
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const uploadedUrls: string[] = [];
      let documentContext = '';
      
      for (const attachment of attachments) {
        if (attachment.type === 'document' && attachment.url) {
          const docContent = await documentService.queryDocument(prompt, sessionId || '');
          documentContext += docContent + '\n\n';
        } else if (attachment.type === 'image') {
          try {
            const url = await uploadToSupabase(attachment.file);
            uploadedUrls.push(url);
          } catch (error) {
            console.error('File upload failed:', error);
            toast({
              title: 'Upload Error',
              description: `Failed to upload ${attachment.file.name}`,
              variant: 'destructive'
            });
          }
        }
      }

      let fullPrompt = prompt;
      if (documentContext) {
        fullPrompt = `Context from uploaded documents:\n${documentContext}\n\nUser question: ${prompt}`;
      }
      if (uploadedUrls.length > 0) {
        fullPrompt += '\n\nAttachments:\n' + uploadedUrls.join('\n');
      }

      const contextualPrompt = await buildContextualPrompt(fullPrompt);
      const response = await generateContent(contextualPrompt);
      
      if (response) {
        await conversationService.saveConversation(fullPrompt, response);

        const assistantMessage: Message = { 
          role: 'assistant', 
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
        window.dispatchEvent(new CustomEvent('chat-updated'));
      }
    } catch (error) {
      console.error('Error handling conversation:', error);
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleSearch = () => {
    setIsSearching(!isSearching)
    setSearchQuery('')
  }

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMessage = (content: string) => {
    if (content.includes('<')) {
      return (
        <div 
          className="prose prose-sm sm:prose-base prose-gray max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: content
              .replace(
                /<p class="/g, 
                '<p class="font-normal text-[15px] leading-[1.8] tracking-wide my-1.5 '
              )
              .replace(
                /<h1 class="/g,
                '<h1 class="text-2xl font-bold mt-4 mb-3 text-gray-800 '
              )
              .replace(
                /<h2 class="/g,
                '<h2 class="text-xl font-semibold mt-3 mb-2 text-gray-700 '
              )
              .replace(
                /<h3 class="/g,
                '<h3 class="text-lg font-medium mt-2 mb-1.5 text-gray-600 '
              )
              .replace(
                /\n---\n/g,
                '<hr class="my-3 border-t border-gray-200" />'
              )
              .replace(/\n\n+/g, '\n')
              .replace(
                /<li class="/g,
                '<li class="my-0.5 text-[15px] leading-[1.8] '
              )
              .replace(
                /<blockquote class="/g,
                '<blockquote class="italic text-gray-600 border-l-4 pl-4 my-2 '
              )
              .replace(
                /<pre class="/g,
                '<pre class="bg-gray-50 rounded-lg p-3 my-2 overflow-x-auto '
              )
              .replace(
                /<code class="/g,
                '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-blue-600 font-mono '
              )
          }} 
        />
      );
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-3 text-gray-800">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-3 mb-2 text-gray-700">{line.slice(3)}</h2>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 my-0.5 text-[15px] leading-[1.8]">{line.slice(2)}</li>;
      } else if (line.trim() === '---') {
        return <hr key={index} className="my-3 border-t border-gray-200" />;
      } else {
        return (
          <p key={index} className="font-normal text-[15px] leading-[1.8] tracking-wide text-gray-700 my-1.5">
            {line}
          </p>
        );
      }
    });
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      const formattedText = stripHtmlAndFormatText(text);
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }
      
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

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden 
      px-3 sm:px-4 md:px-6 lg:px-8 py-0 sm:p-1 
      w-full max-w-[1600px] mx-auto
      bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      <StoryCreationPopup
        isOpen={isStoryPopupOpen}
        onClose={() => setIsStoryPopupOpen(false)}
        onSubmit={handleStorySubmit}
      />
      <StoryRewriterPopup
        isOpen={isStoryRewriterPopupOpen}
        onClose={() => setIsStoryRewriterPopupOpen(false)}
        onSubmit={handleStorySubmit}
      />
      <Card 
        className="flex-1 mx-0.5 my-0.5 sm:m-2 
          bg-white/60 backdrop-blur-[10px] 
          rounded-lg sm:rounded-[2rem] 
          border border-white/20 
          shadow-[0_8px_40px_rgba(0,0,0,0.12)] 
          relative
          flex flex-col
          overflow-hidden
          w-full
          max-w-[1400px]
          mx-auto
          h-[calc(100dvh-20px)] sm:h-[calc(98dvh-16px)]"
      >
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] animate-glow">
          <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] 
            bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 
            blur-xl opacity-50 animate-gradient-x">
          </div>
        </div>

        <CardHeader 
          className="border-b border-white/20 
            px-2 sm:px-6 py-1.5 sm:py-3
            flex flex-row justify-between items-center 
            bg-white/40 backdrop-blur-[10px]
            relative z-10
            h-auto sm:h-auto flex-shrink-0"
        >
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6 sm:w-10 sm:h-10">
              <AvatarImage src="/assets/ai.png" alt="AI Avatar" />
            </Avatar>
            <span className="font-medium text-xs sm:text-base hidden sm:inline">Bohurupi AI : Your Personalized AI Assistant</span>
            <span className="font-medium text-xs sm:hidden">Bohurupi AI</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 sm:h-10 px-3 sm:px-4 rounded-full group relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Story Tools
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end"
                className="w-48 bg-white/90 backdrop-blur-xl border-gray-200/50 rounded-xl shadow-lg p-1.5"
              >
                <DropdownMenuItem 
                  onClick={() => setIsStoryPopupOpen(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-blue-50/80 transition-colors duration-200 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Create Story</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsStoryRewriterPopupOpen(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-purple-50/80 transition-colors duration-200 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Rewrite Story</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" onClick={toggleSearch}>
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-red-500 hover:text-red-600"
              onClick={async () => {
                try {
                  await conversationService.clearConversationHistory();
                  setMessages([{
                    role: 'assistant',
                    content: defaultMessage || "Chat history cleared. How can I help you?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }]);
                  toast({
                    title: "Chat Cleared",
                    description: "The conversation history has been cleared.",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to clear chat history",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent 
          className="flex-1 flex flex-col overflow-hidden p-0 
            h-[calc(100dvh-60px)] sm:h-[calc(94dvh-100px)]"
        >
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
          
          <div 
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/20 
              scrollbar-track-transparent hover:scrollbar-thumb-blue-500/30 
              transition-colors duration-200
              scroll-smooth"
          >
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 relative z-10">
              <AnimatePresence>
                {(searchQuery ? filteredMessages : messages).map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-1 sm:space-x-2 
                      max-w-[85%] sm:max-w-[80%] 
                      ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-5 h-5 sm:w-8 sm:h-8 mt-0.5">
                        <AvatarImage 
                          src={message.role === 'user' ? "/assets/pritam-img.png" : "/assets/ai-icon.png"} 
                          alt={message.role === 'user' ? "User" : "AI"} 
                        />
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <motion.div
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl 
                            ${message.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                              : 'bg-white/50 backdrop-blur-[10px] border border-white/20 text-gray-900'
                            }`}
                        >
                          <div className={`whitespace-pre-wrap break-words text-xs sm:text-sm ${
                            message.role === 'user' ? 'text-white/90' : ''
                          }`}>
                            {message.role === 'user' ? (
                              <div className="text-white leading-relaxed">{message.content}</div>
                            ) : (
                              <div className="space-y-1">
                                {formatMessage(message.content)}
                              </div>
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
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copyToClipboard(message.content, index);
                                    }}
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
                        <span className="text-[10px] sm:text-xs text-gray-500 px-1.5">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-2 max-w-[80%]">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/assets/ai-icon.png" alt="AI" />
                      </Avatar>
                      <div className="flex space-x-2 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-[10px] border border-white/20">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} className="scroll-mt-[100px]" />
            </div>
          </div>

          <div className="border-t bg-transparent p-2 sm:p-4">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-300">
                  </div>
                  <div className="relative rounded-[2.5rem] overflow-hidden 
                    bg-white/10 backdrop-blur-md border border-white/20 
                    shadow-lg group-hover:shadow-xl transition-all duration-300">
                    
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
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="w-full min-h-[60px] max-h-[200px] px-6 py-4 text-base
                        bg-transparent border-none focus:outline-none focus:ring-0 focus:border-none
                        placeholder:text-gray-400 resize-none selection:bg-blue-200/30
                        [&:not(:focus)]:border-none [&:not(:focus)]:ring-0
                        focus-visible:ring-0 focus-visible:ring-offset-0"
                      style={{ 
                        height: 'auto',
                        overflowY: 'auto',
                        lineHeight: '1.5'
                      }}
                    />
                    
                    <div className="flex items-center justify-between p-3 
                      border-t border-white/10 bg-white/5">
                      
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl hover:bg-white/10 transition-all duration-300
                            flex items-center gap-2 text-sm group/attach
                            flex-shrink-0"
                        >
                          <ImageIcon className="w-4 h-4 group-hover/attach:scale-110 
                            transition-transform duration-300" />
                          <span className="hidden sm:inline">Attach</span>
                        </Button>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />

                        <div className="flex-shrink-0 min-w-0">
                          <ModelSelector 
                            onModelChange={onModelChange}
                            compact
                            isChatMode
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit"
                        disabled={!prompt.trim() && attachments.length === 0 || isLoading}
                        className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                          hover:from-purple-600 hover:to-blue-600 text-white
                          shadow-lg hover:shadow-xl transition-all duration-300
                          transform hover:-translate-y-0.5 hover:scale-105
                          px-4 sm:px-6 py-2 text-sm font-medium
                          flex-shrink-0"
                      >
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">
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
    </div>
  )
}