import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ImagePreviewProps {
  src: string;
  alt: string;
  prompt: string;
  onClose: () => void;
}

export default function ImagePreview({ src, alt, prompt, onClose }: ImagePreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename from the prompt or use a default name
      const filename = `${prompt.slice(0, 30).trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast({
        title: "Copied",
        description: "Prompt copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-7xl mx-auto p-4" onClick={e => e.stopPropagation()}>
        <div className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md">
          <div className={`relative ${isZoomed ? 'w-[90vw] h-[90vh]' : 'w-[80vw] h-[80vh]'} 
            transition-all duration-300`}>
            <Image
              src={src}
              alt={alt}
              fill
              className={`object-contain transition-transform duration-300 
                ${isZoomed ? 'scale-150' : 'scale-100'}`}
            />
          </div>
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 backdrop-blur-md 
                hover:bg-white/20 border-white/20
                text-white shadow-lg"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {isZoomed ? (
                <ZoomOut className="h-4 w-4" />
              ) : (
                <ZoomIn className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 backdrop-blur-md 
                hover:bg-white/20 border-white/20
                text-white shadow-lg"
              onClick={handleCopyPrompt}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 backdrop-blur-md 
                hover:bg-white/20 border-white/20
                text-white shadow-lg"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 backdrop-blur-md 
                hover:bg-white/20 border-white/20
                text-white shadow-lg"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 