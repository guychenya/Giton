
import { GoogleGenAI, Type, GenerateContentResponse, Chat, GenerateContentParameters, Content } from "@google/genai";
import { Example } from '../types';
import { Message } from '../hooks/useAssistant';

class GeminiService {
  private googleAi: GoogleGenAI | null = null;

  constructor() {
    this.initializeGoogleAI();
  }

  private initializeGoogleAI() {
    // Try environment variable first (Netlify build-time injection)
    let apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    // Try to get from settings if available
    if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'undefined') {
      try {
        const settings = localStorage.getItem('giton-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          apiKey = parsed.geminiApiKey;
        }
      } catch (e) {
        console.warn('Could not load API key from settings');
      }
    }
    
    console.log('API Key status:', apiKey ? 'Found' : 'Not found');
    
    if (apiKey && apiKey !== 'YOUR_API_KEY' && apiKey !== 'undefined') {
      this.googleAi = new GoogleGenAI({ apiKey });
      console.log('Gemini AI initialized successfully');
    } else {
      console.warn("Gemini API Key not found. Please add it in Settings or check Netlify environment variables.");
      this.googleAi = null;
    }
  }
  
  public reinitialize() {
    this.initializeGoogleAI();
  }

  public getGoogleGenAIInstance(): GoogleGenAI | null {
      return this.googleAi;
  }

  private async callGoogleAPI(modelId: string, contents: string | Content, config?: any): Promise<GenerateContentResponse> {
    if (!this.googleAi) {
        throw new Error("Google AI service not initialized. API Key might be missing.");
    }

    const requestBody: GenerateContentParameters = {
        model: modelId,
        contents: typeof contents === 'string' ? { parts: [{ text: contents }] } : contents,
        config: config
    };

    // Cleanup undefined config keys
    if (requestBody.config) {
        Object.keys(requestBody.config).forEach(key => {
            if (requestBody.config[key] === undefined) delete requestBody.config[key];
        });
        if (Object.keys(requestBody.config).length === 0) delete requestBody.config;
    }

    return await this.googleAi.models.generateContent(requestBody);
  }

  async analyzeRepository(repoContext: string): Promise<Example[]> {
    const prompt = `
      Analyze the following GitHub repository information (README, topics, and file structure).
      Your goal is to create a curated list of "Modules", "Features", "Key Concepts", or "Examples".
      Structure the response as a list of items (8-12 items total).
      
      Return ONLY a JSON array. No text before or after.
      
      Item format:
      {
        "name": "Short Title",
        "description": "Brief explanation (10-15 words)",
        "icon": "One of: 'backend', 'frontend', 'database', 'config', 'security', 'docs', 'terminal'",
        "category": "One of: 'Backend', 'Frontend', 'Database', 'Config', 'Documentation', 'Core', 'Infrastructure', 'Tools'",
        "repoUrl": "Full GitHub URL to file/folder",
        "websiteUrl": "Official website or repo URL",
        "whenToUse": "Short tip on usage",
        "popularSites": ["Site1", "Site2"]
      }

      Repository Context:
      ${repoContext}
    `;

    try {
      const response = await this.callGoogleAPI('gemini-2.5-flash', prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING },
              category: { type: Type.STRING },
              repoUrl: { type: Type.STRING },
              websiteUrl: { type: Type.STRING },
              whenToUse: { type: Type.STRING },
              popularSites: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['name', 'description', 'icon', 'category', 'whenToUse', 'popularSites']
          }
        }
      });

      const text = response.text || '[]';
      // Robust JSON extraction
      const jsonMatch = text.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : '[]';
      
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error analyzing repository:", error);
      return [];
    }
  }

  async generateDetail(itemName: string, repoContext: string): Promise<string> {
    const prompt = `
      You are a technical documentation writer.
      Write a detailed documentation page (in Markdown) for the topic "${itemName}" based on the provided repository context.
      Structure: Title, Overview, Code Context, Usage/Explanation, Pros/Cons.
      Repository Context:
      ${repoContext}
    `;
    const res = await this.callGoogleAPI('gemini-2.5-flash', prompt);
    return res.text || "# Error\nFailed to generate content.";
  }

  async generateArchitectureDiagram(repoContext: string): Promise<string> {
    const prompt = `
      Generate a Mermaid.js flowchart definition for this system.
      - Use 'graph TB'.
      - NO HTML labels. Use simple text strings in double quotes.
      - Do NOT use parentheses () or brackets [] inside labels.
      - Return ONLY the mermaid code.
      Repository Context:
      ${repoContext}
    `;
    const res = await this.callGoogleAPI('gemini-2.5-flash', prompt);
    return (res.text || '').replace(/```mermaid/g, '').replace(/```/g, '').trim();
  }

  async generatePRD(repoContext: string): Promise<string> {
    const prompt = `
      Generate a comprehensive Product Requirements Document (PRD) in Markdown using the "Vibe-Spec" framework.
      Repository Context:
      ${repoContext}
    `;
    const res = await this.callGoogleAPI('gemini-2.5-flash', prompt);
    return res.text || "# Error\nFailed to generate PRD.";
  }

  async performWebSearch(query: string): Promise<string> {
    const prompt = `Search the web for: ${query}. Return a concise summary with sources.`;
    const res = await this.callGoogleAPI('gemini-2.5-flash', prompt, {
        tools: [{ googleSearch: {} }]
    });
    
    let text = res.text || "No results.";
    const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const sources = chunks.map((c: any) => c.web ? `[${c.web.title}](${c.web.uri})` : null).filter(Boolean).join('\n');
        if (sources) text += `\n\nSources:\n${sources}`;
    }
    return text;
  }

  async *chat(messages: Message[], systemInstruction: string): AsyncGenerator<string, void, unknown> {
      if (!this.googleAi) throw new Error("AI not initialized");
      
      try {
          const model = this.googleAi.models.get('gemini-2.5-flash');
          
          // Build conversation history
          const contents: Content[] = [];
          
          // Add system instruction as first message
          if (systemInstruction) {
              contents.push({
                  role: 'user',
                  parts: [{ text: systemInstruction }]
              });
              contents.push({
                  role: 'model', 
                  parts: [{ text: 'I understand. I\'ll help you with the repository analysis.' }]
              });
          }
          
          // Add conversation history
          messages.forEach(msg => {
              contents.push({
                  role: msg.role === 'user' ? 'user' : 'model',
                  parts: [{ text: msg.text }]
              });
          });
          
          const response = await model.generateContentStream({ contents });
          
          for await (const chunk of response) {
              const text = chunk.text;
              if (text) yield text;
          }
      } catch (error) {
          console.error('Chat error:', error);
          yield 'Sorry, I encountered an error. Please try again.';
      }
  }
}

export const geminiService = new GeminiService();
