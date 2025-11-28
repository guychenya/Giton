# GitOn 🚀

A modern SaaS application that uses AI to analyze any GitHub repository and provide instant documentation, examples, and interactive analysis.

## 🌟 Features

- **Smart Repository Search**: Search by username, repo name, or paste URL - auto-expands user repos
- **AI-Powered Documentation**: Generate comprehensive guides with multiple AI providers (Gemini, OpenAI, Claude)
- **Interactive Assistant**: Chat with AI about your code with model selection
- **Architecture Diagrams**: Auto-generate system design diagrams with Mermaid
- **PRD Generation**: Create Product Requirements Documents automatically
- **Project Library**: Save and manage analyzed projects with IndexedDB
- **API Key Validation**: Test and verify API keys with lightning-fast validation
- **Professional UI**: Clean GitHub-style settings, tabular layouts, smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool

### AI & APIs
- **Google Gemini API** - Primary AI for analysis and chat
- **OpenRouter** - Access to Claude, GPT-4, Llama models
- **OpenAI API** - Direct GPT integration
- **GitHub API** - Repository data and user search

### Visualization & UX
- **Mermaid.js** - System architecture diagrams
- **Custom Markdown Renderer** - Rich content display
- **Animated Loading States** - Water fill effects, progress indicators
- **Smooth Transitions** - Professional animations throughout

### Data Management
- **IndexedDB** - Client-side project persistence
- **Local Storage** - Settings and preferences
- **Real-time Validation** - API key verification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for development)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/guychenya/Gitexplore.git
   cd Gitexplore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 🌐 Deploy to Netlify

### Quick Deploy

1. **Fork this repository**

2. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your forked repository

3. **Configure build**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Set environment variables**
   ```
   VITE_GEMINI_API_KEY = your_gemini_api_key_here
   ```

5. **Deploy** - Your site will be live at `https://your-site-name.netlify.app`

### Post-Deploy
- Users can add their own API keys in Settings
- API keys are validated before use
- All data stored locally in browser

### Method 2: Manual Deploy

1. **Prepare files**
   ```bash
   # No build step needed - deploy as static files
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=.
   ```

### Method 3: Drag & Drop

1. **Zip your project files**
2. **Go to Netlify dashboard**
3. **Drag and drop the zip file**
4. **Configure environment variables** in site settings

## 📁 Project Structure

```
giton/
├── components/
│   ├── Assistant.tsx           # AI chat with model selector
│   ├── SettingsPage.tsx        # GitHub-style settings
│   ├── UnifiedSearch.tsx       # Smart search with auto-expand
│   ├── ArchitectureModal.tsx   # Mermaid diagram viewer
│   ├── ExampleCard.tsx         # Repository analysis cards
│   └── ExampleDetailModal.tsx  # Enhanced loading states
├── services/
│   ├── geminiService.ts        # Gemini AI integration
│   ├── llmService.ts           # Multi-provider LLM support
│   └── openRouterService.ts    # OpenRouter integration
├── utils/
│   ├── githubUtils.ts          # GitHub API + search
│   └── db.ts                   # IndexedDB for projects
├── App.tsx                     # Main app with water-fill loading
└── vite.config.ts              # Build configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Recommended |

### User Settings (In-App)
- **API Keys**: Add Gemini, OpenAI, OpenRouter keys
- **Validation**: Test keys with ⚡ lightning icon
- **Model Selection**: Choose AI model in chat interface
- **Auto-save**: Toggle automatic project saving

### Vite Configuration

The project uses Vite with custom configuration for:
- Environment variable injection
- Path aliases
- Development server settings

## 🎯 Usage

### Quick Start
1. **Search**: Type a username (e.g., `facebook`) or repo name, or paste a GitHub URL
2. **Auto-expand**: Username searches automatically show all repos
3. **Analyze**: Select a repo and watch the beautiful loading animation
4. **Explore**: Browse AI-generated cards with documentation
5. **Chat**: Use the assistant with model selection (Gemini, GPT-4, Claude)
6. **Export**: Save diagrams, PRDs, and docs in multiple formats

### Advanced Features
- **API Key Management**: Validate keys with ⚡ lightning icon
- **Model Switching**: Change AI models on-the-fly in chat
- **Project Library**: Access saved analyses anytime
- **Architecture Diagrams**: Generate and export system designs
- **New Chat Sessions**: Start fresh conversations easily

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI capabilities
- **GitHub API** for repository data access
- **Mermaid** for diagram generation
- **Tailwind CSS** for beautiful styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [Guy Chenya](https://www.linkedin.com/in/guychenya/)

---

Made with ❤️ by [Guy Chenya](https://www.linkedin.com/in/guychenya/) - GitOn: Your AI-powered GitHub repository analyzer.