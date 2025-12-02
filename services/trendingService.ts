const CACHE_KEY = 'trending_ai_repos';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface TrendingRepo {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string;
}

export async function getTrendingAIRepos(): Promise<TrendingRepo[]> {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const response = await fetch(
      'https://api.github.com/search/repositories?q=machine-learning+stars:>10000&sort=stars&order=desc&per_page=20'
    );
    
    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return getFallbackRepos();
    }
    
    const json = await response.json();
    
    if (!json.items || json.items.length === 0) {
      return getFallbackRepos();
    }
    
    const repos: TrendingRepo[] = json.items.map((item: any) => ({
      owner: item.owner.login,
      repo: item.name,
      description: item.description || 'No description',
      stars: item.stargazers_count,
      language: item.language || 'Unknown'
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: repos, timestamp: Date.now() }));
    return repos;
  } catch (error) {
    console.error('Failed to fetch trending repos:', error);
    return getFallbackRepos();
  }
}

function getFallbackRepos(): TrendingRepo[] {
  return [
    { owner: 'tensorflow', repo: 'tensorflow', description: 'An Open Source Machine Learning Framework for Everyone', stars: 185000, language: 'C++' },
    { owner: 'pytorch', repo: 'pytorch', description: 'Tensors and Dynamic neural networks in Python with strong GPU acceleration', stars: 82000, language: 'Python' },
    { owner: 'openai', repo: 'openai-cookbook', description: 'Examples and guides for using the OpenAI API', stars: 60000, language: 'Jupyter Notebook' },
    { owner: 'langchain-ai', repo: 'langchain', description: 'Building applications with LLMs through composability', stars: 95000, language: 'Python' },
    { owner: 'microsoft', repo: 'autogen', description: 'Enable Next-Gen Large Language Model Applications', stars: 35000, language: 'Python' },
    { owner: 'huggingface', repo: 'transformers', description: 'State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX', stars: 135000, language: 'Python' },
    { owner: 'ggerganov', repo: 'llama.cpp', description: 'LLM inference in C/C++', stars: 68000, language: 'C++' },
    { owner: 'AUTOMATIC1111', repo: 'stable-diffusion-webui', description: 'Stable Diffusion web UI', stars: 142000, language: 'Python' },
    { owner: 'comfyanonymous', repo: 'ComfyUI', description: 'The most powerful and modular diffusion model GUI', stars: 55000, language: 'Python' },
    { owner: 'ollama', repo: 'ollama', description: 'Get up and running with Llama 3.2, Mistral, Gemma 2, and other large language models', stars: 95000, language: 'Go' },
    { owner: 'meta-llama', repo: 'llama', description: 'Inference code for Llama models', stars: 56000, language: 'Python' },
    { owner: 'anthropics', repo: 'anthropic-sdk-python', description: 'SDK for Anthropic Claude API', stars: 1500, language: 'Python' },
    { owner: 'openai', repo: 'gpt-4', description: 'GPT-4 Technical Report and Resources', stars: 8000, language: 'Python' },
    { owner: 'facebookresearch', repo: 'llama', description: 'Inference code for LLaMA models', stars: 56000, language: 'Python' },
    { owner: 'mlc-ai', repo: 'mlc-llm', description: 'Universal LLM Deployment Engine with ML Compilation', stars: 19000, language: 'Python' },
    { owner: 'invoke-ai', repo: 'InvokeAI', description: 'Invoke is a leading creative engine for Stable Diffusion models', stars: 23000, language: 'Python' },
    { owner: 'CompVis', repo: 'stable-diffusion', description: 'A latent text-to-image diffusion model', stars: 68000, language: 'Python' },
    { owner: 'oobabooga', repo: 'text-generation-webui', description: 'A Gradio web UI for Large Language Models', stars: 40000, language: 'Python' },
    { owner: 'lm-sys', repo: 'FastChat', description: 'An open platform for training, serving, and evaluating large language models', stars: 37000, language: 'Python' },
    { owner: 'gpt4all', repo: 'gpt4all', description: 'Run open-source LLMs anywhere', stars: 70000, language: 'C++' }
  ];
}
