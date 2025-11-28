export interface RepoData {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  readmeContent: string;
  fileStructure: string;
}

export interface SuggestedRepo {
  owner: string;
  repo: string;
  stars: number;
  description: string;
  language?: string;
  updatedAt?: string;
}

export interface RepoGroup {
  category: string;
  items: SuggestedRepo[];
}

const FALLBACK_SUGGESTIONS: RepoGroup[] = [
    {
        category: 'Web Frameworks',
        items: [
            { owner: 'facebook', repo: 'react', stars: 213000, description: 'A library for building user interfaces' },
            { owner: 'vuejs', repo: 'vue', stars: 206000, description: 'The Progressive JavaScript Framework' },
            { owner: 'vercel', repo: 'next.js', stars: 112000, description: 'The React Framework' }
        ]
    },
    {
        category: 'Backend & Tools',
        items: [
            { owner: 'expressjs', repo: 'express', stars: 62000, description: 'Fast, unopinionated, minimalist web framework for Node.js' },
            { owner: 'docker', repo: 'compose', stars: 31000, description: 'Define and run multi-container applications with Docker' },
            { owner: 'nestjs', repo: 'nest', stars: 61000, description: 'A progressive Node.js framework' }
        ]
    },
    {
        category: 'Machine Learning',
        items: [
            { owner: 'tensorflow', repo: 'tensorflow', stars: 180000, description: 'An Open Source Machine Learning Framework for Everyone' },
            { owner: 'pytorch', repo: 'pytorch', stars: 75000, description: 'Tensors and Dynamic neural networks in Python' },
            { owner: 'langchain-ai', repo: 'langchain', stars: 72000, description: 'Building applications with LLMs through composability' }
        ]
    }
];

export async function searchRepositories(query: string, page = 1, perPage = 10): Promise<{ items: SuggestedRepo[], total_count: number }> {
  if (!query.trim()) return { items: [], total_count: 0 };
  
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}&page=${page}`);
    
    if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw new Error(`GitHub API Error: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.items || !Array.isArray(data.items)) {
        return { items: [], total_count: 0 };
    }

    const items = data.items.map((item: any) => ({
        owner: item.owner.login,
        repo: item.name,
        stars: item.stargazers_count,
        description: item.description || 'No description available.',
        language: item.language,
        updatedAt: item.updated_at
    }));

    return { items, total_count: data.total_count };
  } catch (error) {
    console.error("Error searching repositories:", error);
    throw error;
  }
}

export async function fetchSuggestedRepos(): Promise<RepoGroup[]> {
  // To make it dynamic, we pick a random page (1-5) for variety.
  const randomPage = Math.floor(Math.random() * 5) + 1;
  
  const queries = [
    { category: 'Trending Web', q: 'topic:react OR topic:vue OR topic:nextjs sort:stars order:desc' },
    { category: 'System & Infra', q: 'topic:docker OR topic:kubernetes OR topic:rust sort:stars order:desc' },
    { category: 'AI & ML', q: 'topic:machine-learning OR topic:artificial-intelligence sort:stars order:desc' }
  ];

  const fetchWithTimeout = async (url: string, timeout = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  try {
    const promises = queries.map(async ({ category, q }) => {
       const res = await fetchWithTimeout(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=3&page=${randomPage}`);
       if (!res.ok) {
         if (res.status === 403) throw new Error('GitHub API rate limit exceeded.');
         throw new Error(`GitHub API Error: ${res.status}`);
       }
       
       const data = await res.json();
       
       if (!data.items || !Array.isArray(data.items)) {
           throw new Error('Invalid response format from GitHub');
       }

       return {
         category,
         items: data.items.map((item: any) => ({
           owner: item.owner.login,
           repo: item.name,
           stars: item.stargazers_count,
           description: item.description || 'No description available.'
         }))
       };
    });
    
    const results = await Promise.all(promises);
    // Double check we actually got items
    if (results.every(r => r.items.length === 0)) {
        throw new Error('No items found in any category');
    }
    return results;
  } catch (error) {
    console.warn('Failed to fetch dynamic suggestions (likely rate limit or timeout), using fallback.', error);
    return FALLBACK_SUGGESTIONS;
  }
}

export async function fetchRepoData(repoUrl: string): Promise<RepoData> {
  // Extract owner and repo from various URL formats
  // e.g., https://github.com/owner/repo or owner/repo
  let owner = '';
  let repo = '';

  const cleanUrl = repoUrl.replace(/\/$/, '');
  if (cleanUrl.startsWith('http')) {
    const parts = cleanUrl.split('/');
    owner = parts[parts.length - 2];
    repo = parts[parts.length - 1];
  } else {
    const parts = cleanUrl.split('/');
    if (parts.length === 2) {
      owner = parts[0];
      repo = parts[1];
    }
  }

  if (!owner || !repo) {
    throw new Error('Invalid repository URL format. Please use "owner/repo" or a full GitHub URL.');
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    // 1. Fetch Metadata (includes topics)
    const metaRes = await fetch(baseUrl);
    if (!metaRes.ok) {
        if (metaRes.status === 403) {
            throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
        }
        throw new Error(`Failed to fetch repo metadata: ${metaRes.statusText} (${metaRes.status})`);
    }
    const meta = await metaRes.json();

    // 2. Fetch README
    let readmeContent = '';
    try {
      const readmeRes = await fetch(`${baseUrl}/readme`, {
        headers: { 'Accept': 'application/vnd.github.raw' }
      });
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
      }
    } catch (e) {
      console.warn('Could not fetch README', e);
    }

    // 3. Fetch Root Contents (File Structure)
    let fileStructure = '';
    try {
      const contentsRes = await fetch(`${baseUrl}/contents`);
      if (contentsRes.ok) {
        const files = await contentsRes.json();
        if (Array.isArray(files)) {
          fileStructure = files.map((f: any) => `- ${f.name} (${f.type})`).join('\n');
        }
      }
    } catch (e) {
      console.warn('Could not fetch file structure', e);
    }

    // Truncate README if too large to save context window
    if (readmeContent.length > 30000) {
        readmeContent = readmeContent.substring(0, 30000) + "\n...[Truncated]...";
    }

    return {
      owner,
      repo,
      description: meta.description || 'No description provided.',
      stars: meta.stargazers_count,
      language: meta.language || 'Unknown',
      topics: meta.topics || [],
      readmeContent,
      fileStructure
    };
  } catch (error: any) {
    console.error("GitHub Data Fetch Error:", error);
    throw error; // Re-throw the specific error
  }
}