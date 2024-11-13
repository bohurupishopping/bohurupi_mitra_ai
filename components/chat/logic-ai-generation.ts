import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useAIGeneration = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('groq');
  const [generatedContent, setGeneratedContent] = useState('');

  const generateContent = useCallback(async (prompt: string) => {
    try {
      const options = {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 0.4
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (data.result) {
        setGeneratedContent(data.result);
        return data.result;
      }

      throw new Error('No content generated');
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: 'Generation Error',
        description: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      return null;
    }
  }, [selectedModel, toast]);

  return {
    selectedModel,
    setSelectedModel,
    generatedContent,
    generateContent
  };
}; 