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
    // Get repos created in the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const dateStr = twoWeeksAgo.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api.github.com/search/repositories?q=ai+OR+machine-learning+OR+llm+OR+gpt+OR+chatbot+created:>${dateStr}&sort=stars&order=desc&per_page=20`
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
    { owner: 'example', repo: 'new-ai-project', description: 'No trending repos found. Try again later.', stars: 0, language: 'Python' }
  ];
}
