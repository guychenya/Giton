
export interface Example {
  name: string;
  description: string;
  icon: string;
  category: string;
  repoUrl: string;
  websiteUrl: string;
  whenToUse: string;
  popularSites: string[];
}

export interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
}
