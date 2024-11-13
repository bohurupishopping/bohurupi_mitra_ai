import { supabase } from '@/integrations/supabase/client';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { TextLoader } from 'langchain/document_loaders/fs/text';

export class DocumentService {
  private embeddings: OpenAIEmbeddings;
  private tableName = 'documents';
  private queryName = 'match_documents';

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    });
  }

  async processDocument(file: File, sessionId: string): Promise<string> {
    try {
      // Upload to Supabase Storage
      const { url, path } = await this.uploadFile(file, sessionId);
      
      // Load and parse document
      const docs = await this.loadDocument(file);
      
      // Sanitize document content
      const sanitizedDocs = this.sanitizeDocuments(docs);
      
      // Split into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await textSplitter.splitDocuments(sanitizedDocs);

      // Store in Supabase Vector Store
      await this.storeDocumentChunks(chunks, sessionId, path);

      return url;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  private sanitizeDocuments(docs: Document[]): Document[] {
    return docs.map(doc => ({
      ...doc,
      pageContent: this.sanitizeText(doc.pageContent),
      metadata: {
        ...doc.metadata,
        text: this.sanitizeText(doc.metadata.text || ''),
      },
    }));
  }

  private sanitizeText(text: string): string {
    return text
      // Replace problematic Unicode characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Replace smart quotes with regular quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Replace other problematic characters
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      // Remove zero-width spaces and other invisible characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim();
  }

  private async uploadFile(file: File, sessionId: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${sessionId}/documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  }

  private async loadDocument(file: File): Promise<Document[]> {
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer]);
    
    try {
      const text = await this.extractTextFromFile(file, blob);
      return [
        new Document({
          pageContent: text,
          metadata: { source: file.name }
        })
      ];
    } catch (error) {
      console.error('Error loading document:', error);
      throw new Error(`Failed to load document: ${file.name}`);
    }
  }

  private async extractTextFromFile(file: File, blob: Blob): Promise<string> {
    if (file.type === 'application/pdf') {
      // For PDFs, use a text extraction approach
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            resolve(this.sanitizeText(text));
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsText(blob);
      });
    } else {
      // For other files, use TextLoader
      const loader = new TextLoader(blob);
      const docs = await loader.load();
      return docs[0]?.pageContent || '';
    }
  }

  private async storeDocumentChunks(chunks: Document[], sessionId: string, filePath: string) {
    try {
      // Ensure chunks are properly formatted and sanitized
      const sanitizedChunks = chunks.map(chunk => ({
        ...chunk,
        pageContent: this.sanitizeText(chunk.pageContent),
        metadata: {
          ...chunk.metadata,
          session_id: sessionId,
          file_path: filePath,
        },
      }));

      const vectorStore = await SupabaseVectorStore.fromDocuments(
        sanitizedChunks,
        this.embeddings,
        {
          client: supabase,
          tableName: this.tableName,
          queryName: this.queryName,
          filter: { session_id: sessionId },
        }
      );

      return vectorStore;
    } catch (error) {
      console.error('Error storing document chunks:', error);
      throw new Error('Failed to store document in vector database');
    }
  }

  async queryDocument(query: string, sessionId: string): Promise<string> {
    try {
      const vectorStore = await SupabaseVectorStore.fromExistingIndex(
        this.embeddings,
        {
          client: supabase,
          tableName: this.tableName,
          queryName: this.queryName,
        }
      );

      // Add explicit filter for session_id
      const results = await vectorStore.similaritySearch(query, 4, {
        filter: { session_id: sessionId }
      });

      if (!results.length) {
        return 'No relevant content found in the document.';
      }

      // Process and combine results
      return results
        .map(doc => {
          const content = this.sanitizeText(doc.pageContent);
          return content;
        })
        .filter(content => content.trim() !== '')
        .join('\n\n');
    } catch (error) {
      console.error('Error querying document:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to query document: ${error.message}`);
      }
      throw new Error('Failed to query document');
    }
  }

  // Helper method to clean up documents for a session
  async cleanupSessionDocuments(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .filter('metadata->session_id', 'eq', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up session documents:', error);
    }
  }
} 