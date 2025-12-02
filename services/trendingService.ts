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
      'https://api.github.com/search/repositories?q=topic:artificial-intelligence+OR+topic:machine-learning+OR+topic:deep-learning+OR+topic:ai&sort=stars&order=desc&per_page=20'
    );
    const json = await response.json();
    
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
    return [];
  }
}
