import { AppSettings } from '../components/SettingsModal';
import { OpenRouterService } from './openRouterService';

export interface LLMProvider {
  name: string;
  chat: (messages: any[], systemPrompt: string) => AsyncGenerator<string>;
  generateContent: (prompt: string, context: string) => Promise<string>;
  isAvailable: () => boolean;
}

class HuggingFaceProvider implements LLMProvider {
  name = 'HuggingFace';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async *chat(messages: any[], systemPrompt: string): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('HuggingFace API key not configured');

    const prompt = this.formatMessages(messages, systemPrompt);
    
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data[0]?.generated_text || 'No response generated';
      
      // Simulate streaming by yielding chunks
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('HuggingFace chat error:', error);
      yield 'Sorry, I encountered an error processing your request.';
    }
  }

  async generateContent(prompt: string, context: string): Promise<string> {
    if (!this.apiKey) throw new Error('HuggingFace API key not configured');

    const fullPrompt = `Context: ${context}\n\nTask: ${prompt}\n\nResponse:`;

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0]?.generated_text || 'No content generated';
    } catch (error) {
      console.error('HuggingFace generation error:', error);
      return 'Error generating content with HuggingFace';
    }
  }

  private formatMessages(messages: any[], systemPrompt: string): string {
    let prompt = systemPrompt + '\n\n';
    messages.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.text}\n`;
    });
    prompt += 'Assistant:';
    return prompt;
  }
}

class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async *chat(messages: any[], systemPrompt: string): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ 
        role: msg.role === 'model' ? 'assistant' : msg.role, 
        content: msg.text 
      }))
    ];

    try {
      const response = await fetch('/.netlify/functions/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages,
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'OpenAI API error');
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No response';
      
      // Simulate streaming
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        yield words.slice(i, i + 3).join(' ') + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      const errorMsg = error.message || error.toString();
      yield `OpenAI Error: ${errorMsg}. Please check your API key in Settings.`;
    }
  }

  async generateContent(prompt: string, context: string): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: `Context: ${context}` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No content generated';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      return 'Error generating content with OpenAI';
    }
  }
}

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.initializeProviders();
  }

  updateSettings(settings: AppSettings) {
    this.settings = settings;
    this.initializeProviders();
  }

  private initializeProviders() {
    this.providers.clear();

    if (this.settings.openRouterApiKey) {
      this.providers.set('openrouter', new OpenRouterProvider(this.settings.openRouterApiKey, this.settings.preferredModel));
    }

    if (this.settings.huggingFaceApiKey) {
      this.providers.set('huggingface', new HuggingFaceProvider(this.settings.huggingFaceApiKey));
    }

    if (this.settings.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(this.settings.openaiApiKey));
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter(key => 
      this.providers.get(key)?.isAvailable()
    );
  }

  getProvider(providerName?: string): LLMProvider | null {
    const targetProvider = providerName || this.settings.preferredLLM;
    
    // Try preferred provider first
    if (targetProvider !== 'gemini') {
      const provider = this.providers.get(targetProvider);
      if (provider?.isAvailable()) {
        return provider;
      }
    }

    // Fallback to any available provider
    for (const [name, provider] of this.providers) {
      if (provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }

  async *chat(messages: any[], systemPrompt: string, providerName?: string): AsyncGenerator<string> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      yield 'No LLM provider available. Please configure API keys in settings.';
      return;
    }

    yield* provider.chat(messages, systemPrompt);
  }

  async generateContent(prompt: string, context: string, providerName?: string): Promise<string> {
    const provider = this.getProvider(providerName);
    
    if (!provider) {
      return 'No LLM provider available. Please configure API keys in settings.';
    }

    return provider.generateContent(prompt, context);
  }
}

// Global instance
let llmService: LLMService | null = null;

export const initializeLLMService = (settings: AppSettings) => {
  llmService = new LLMService(settings);
  return llmService;
};

class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';
  private service: OpenRouterService;
  private model: string;

  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
    this.service = new OpenRouterService(apiKey);
    this.model = model;
  }

  isAvailable(): boolean {
    return true;
  }

  async *chat(messages: any[], systemPrompt: string): AsyncGenerator<string> {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ role: msg.role, content: msg.text }))
    ];

    yield* this.service.chat(formattedMessages, this.model);
  }

  async generateContent(prompt: string, context: string): Promise<string> {
    const fullPrompt = `Context: ${context}\n\nTask: ${prompt}\n\nResponse:`;
    return this.service.generateContent(fullPrompt, this.model);
  }
}

export const getLLMService = (): LLMService | null => {
  return llmService;
};