"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, MessageSquare, Code2, Image as ImageIcon, 
  File, RefreshCw, X, FileJson, ScrollText, FileQuestion,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentAI } from '@/components/document/logic-document-ai';
import { DocumentPreview } from '@/components/document/DocumentPreview';
import { FileUpload } from '@/types/conversation';
import { uploadAttachment } from '@/utils/attachmentUtils';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import Sidebar from '@/components/shared/Sidebar';

const DocumentAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string>('');
  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { processDocument } = useDocumentAI({
    defaultModel: 'gemini-1.5-flash'
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileUpload[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/x-javascript',
      'text/x-python',
      'text/md',
      'text/csv',
      'text/xml',
      'text/rtf'
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
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

    try {
      for (const attachment of newAttachments) {
        const { url, path } = await uploadAttachment(attachment.file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);

    try {
      const response = await processDocument(prompt, attachments, 'chat');
      
      if (response && typeof response === 'object' && 'content' in response) {
        setResult(response.content);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={true} onToggle={() => {}} />

      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                bg-clip-text text-transparent">
                Document AI
              </h1>
              <p className="text-gray-500 mt-1">
                Analyze documents and extract insights with AI
              </p>
            </div>
          </div>

          <Card className="flex-1 mx-0.5 my-0.5 sm:m-2 
            bg-white/40 dark:bg-gray-900/40 
            backdrop-blur-[20px] 
            rounded-2xl sm:rounded-[2rem] 
            border border-white/20 dark:border-white/10 
            shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)]
            relative flex flex-col overflow-hidden
            w-full max-w-[1400px] mx-auto">
            <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem]">
              <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] 
                bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 
                dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20
                blur-2xl opacity-50 animate-gradient-x
                motion-safe:transition-opacity motion-safe:duration-500">
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative p-4 bg-white/10 dark:bg-gray-800/10 
                      backdrop-blur-md rounded-2xl border border-white/20 
                      dark:border-white/10 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <FileText className="w-4 h-4" />
                        <span>Uploaded Files ({attachments.length})</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {attachments.map((attachment) => (
                        <motion.div
                          key={attachment.id}
                          layout
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="group relative bg-white/20 dark:bg-gray-900/20 
                            rounded-xl overflow-hidden border border-white/10 
                            shadow-sm hover:shadow-md transition-all duration-300
                            aspect-[4/3]"
                        >
                          {attachment.type === 'image' && attachment.preview ? (
                            <img 
                              src={attachment.preview} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                              <File className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500 text-center truncate max-w-full">
                                {attachment.file.name}
                              </p>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 
                            group-hover:opacity-100 transition-opacity duration-300
                            flex flex-col items-center justify-center p-3">
                            <p className="text-white text-sm text-center mb-2 line-clamp-2">
                              {attachment.file.name}
                            </p>
                            <p className="text-gray-300 text-xs">
                              {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full
                              bg-red-500/80 hover:bg-red-500 text-white
                              opacity-0 group-hover:opacity-100
                              transform scale-90 group-hover:scale-100
                              transition-all duration-300"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {attachment.uploading && (
                            <div className="absolute inset-0 bg-black/50 
                              flex items-center justify-center">
                              <RefreshCw className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-white/10 bg-transparent p-2 sm:p-4">
                <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 
                        dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20
                        rounded-[1.75rem] blur-xl opacity-70 group-hover:opacity-100 
                        motion-safe:transition-all motion-safe:duration-500">
                      </div>
                      <div className="relative rounded-[1.75rem] overflow-hidden 
                        bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl 
                        border border-white/20 dark:border-white/10 
                        shadow-lg hover:shadow-xl 
                        motion-safe:transition-all motion-safe:duration-300">
                        
                        <Textarea
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
                          placeholder="Ask questions about your document..."
                          className="w-full min-h-[60px] max-h-[200px] px-6 py-4
                            bg-transparent border-none focus:outline-none focus:ring-0
                            placeholder:text-gray-400/70 resize-none selection:bg-blue-200/30
                            [&:not(:focus)]:border-none [&:not(:focus)]:ring-0
                            focus-visible:ring-0 focus-visible:ring-offset-0
                            text-gray-700 dark:text-gray-200"
                          style={{ 
                            height: 'auto',
                            overflowY: 'auto',
                            lineHeight: '1.5'
                          }}
                        />
                        
                        <div className="flex items-center justify-between p-2 sm:p-3 
                          border-t border-white/10 bg-gradient-to-b from-transparent to-white/5 
                          dark:to-gray-900/5 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-xl bg-white/10 hover:bg-white/20 
                                dark:bg-gray-900/20 dark:hover:bg-gray-900/30
                                transition-all duration-300 backdrop-blur-sm
                                flex items-center gap-2 text-sm group/attach
                                border border-white/10 dark:border-white/5
                                shadow-sm hover:shadow-md"
                            >
                              <Upload className="w-4 h-4 group-hover/attach:scale-110 
                                transition-transform duration-300" />
                              <span className="hidden sm:inline">Upload Files</span>
                            </Button>
                          </div>

                          <Button 
                            type="submit"
                            disabled={(!prompt.trim() && attachments.length === 0) || isLoading}
                            className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                              hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 
                              disabled:from-gray-400 disabled:to-gray-500
                              text-white font-medium
                              shadow-lg hover:shadow-xl transition-all duration-300
                              transform hover:-translate-y-0.5 hover:scale-[1.02]
                              px-4 sm:px-6 py-2 text-sm
                              border border-white/10 backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-2">
                              {isLoading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span className="text-xs sm:text-sm">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  <span className="text-xs sm:text-sm">Process Document</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.html,.css,.js,.py,.md,.csv,.xml,.rtf"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 relative"
                  >
                    <div className="relative bg-white/20 dark:bg-gray-800/20 rounded-2xl 
                      backdrop-blur-md border border-white/20 dark:border-white/10
                      shadow-lg p-6 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <ScrollText className="w-4 h-4" />
                          <span>Analysis Results</span>
                        </div>
                      </div>
                      <ReactMarkdown
                        components={{
                          pre: ({ node, ...props }) => (
                            <div className="overflow-x-auto max-w-full my-2">
                              <pre {...props} className="p-4 rounded-xl bg-white/20 
                                dark:bg-gray-900/20 backdrop-blur-sm border border-white/10" />
                            </div>
                          ),
                          code: ({ node, ...props }) => (
                            <code {...props} className="break-words" />
                          )
                        }}
                      >
                        {result}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentAI; 