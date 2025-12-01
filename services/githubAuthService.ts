interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
  html_url: string;
}

export class GitHubAuthService {
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('github_access_token');
  }

  // GitHub OAuth login
  initiateLogin() {
    const clientId = 'your_github_client_id'; // Replace with actual client ID
    const redirectUri = window.location.origin + '/auth/callback';
    const scope = 'repo,user';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<boolean> {
    try {
      // In production, this should go through your backend
      const response = await fetch('/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const { access_token } = await response.json();
      
      if (access_token) {
        this.accessToken = access_token;
        localStorage.setItem('github_access_token', access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('GitHub auth error:', error);
      return false;
    }
  }

  // Logout
  logout() {
    this.accessToken = null;
    localStorage.removeItem('github_access_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current user info
  async getCurrentUser(): Promise<GitHubUser | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  // Search users by username
  async searchUsers(username: string): Promise<GitHubUser[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(username)}&per_page=10`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get user's repositories (public + private if authenticated as that user)
  async getUserRepositories(username: string): Promise<GitHubRepo[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      return [];
    }
  }

  // Get user profile info
  async getUserProfile(username: string): Promise<GitHubUser | null> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}

export const githubAuthService = new GitHubAuthService();