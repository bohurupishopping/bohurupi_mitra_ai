import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ConversationService } from '@/services/conversationService';
import { FileUpload } from '@/types/conversation';

interface UseDocumentAIProps {
  conversationService?: ConversationService;
  defaultModel?: string;
}

export const useDocumentAI = (props?: UseDocumentAIProps) => {
  const { 
    conversationService = new ConversationService(), 
    defaultModel = 'gemini-1.5-flash' 
  } = props || {};
  
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [generatedContent, setGeneratedContent] = useState('');

  const processDocument = useCallback(async (
    prompt: string, 
    attachments?: FileUpload[],
    mode: 'chat' | 'json' = 'chat'
  ) => {
    try {
      if (!attachments?.length) {
        throw new Error('No document attached');
      }

      const fileAttachment = attachments.find(att => 
        !att.uploading && att.file
      );

      if (!fileAttachment) {
        throw new Error('Document still uploading or invalid');
      }

      const formData = new FormData();
      formData.append('file', fileAttachment.file);
      formData.append('prompt', mode === 'json' 
        ? `Convert this document to JSON format: ${prompt}`
        : prompt
      );
      formData.append('model', selectedModel);

      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('No content generated');
      }

      // Save to conversation history
      await conversationService.saveConversation(prompt, data.result);
      
      setGeneratedContent(data.result);
      return {
        content: data.result,
        fileType: data.fileType
      };

    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: 'destructive'
      });
      return null;
    }
  }, [selectedModel, toast, conversationService]);

  return {
    selectedModel,
    setSelectedModel,
    generatedContent,
    processDocument
  };
}; 