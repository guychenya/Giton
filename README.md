# GitOn 🚀

A dynamic web application that uses the Gemini API to analyze any GitHub repository and provide instant documentation, examples, and interactive analysis.

## 🌟 Features

- **Repository Analysis**: Analyze any public GitHub repository instantly
- **AI-Powered Documentation**: Generate comprehensive guides and examples
- **Interactive Assistant**: Voice and text-based AI assistant for repository exploration
- **Architecture Diagrams**: Auto-generate system architecture diagrams using Mermaid
- **PRD Generation**: Create Product Requirements Documents automatically
- **Project Library**: Save and manage analyzed projects
- **Real-time Search**: Filter and search through generated content
- **Voice Interaction**: Voice-enabled assistant for hands-free exploration

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Vite** - Fast build tool and development server

### AI & APIs
- **Google Gemini API** - Advanced AI for repository analysis and content generation
- **GitHub API** - Repository data fetching and analysis
- **Web Speech API** - Voice recognition and synthesis

### Visualization
- **Mermaid** - Diagram generation for architecture visualization
- **Custom Markdown Renderer** - Rich content display

### Data Management
- **IndexedDB** - Client-side database for project persistence
- **Local Storage** - Session and preference management

### Development Tools
- **ESM Modules** - Modern JavaScript module system
- **Import Maps** - Dependency management
- **PostCSS** - CSS processing

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

### Method 1: Direct Deploy (Recommended)

1. **Fork this repository** to your GitHub account

2. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your forked repository

3. **Configure build settings**
   - Build command: `echo "No build step needed"`
   - Publish directory: `.` (root directory)

4. **Set environment variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   ```

5. **Deploy**
   - Click "Deploy site"
   - Your site will be live at `https://your-site-name.netlify.app`

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
├── components/          # React components
│   ├── Assistant.tsx    # AI assistant interface
│   ├── ExampleCard.tsx  # Repository analysis cards
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAssistant.ts # Assistant functionality
│   └── ...
├── services/           # API services
│   ├── geminiService.ts # Gemini AI integration
│   └── llmService.ts   # Language model utilities
├── utils/              # Utility functions
│   ├── githubUtils.ts  # GitHub API integration
│   └── db.ts          # IndexedDB operations
├── data/               # Static data
├── lib/                # Core libraries
├── App.tsx             # Main application component
├── index.html          # Entry HTML file
├── index.tsx           # React entry point
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

### Vite Configuration

The project uses Vite with custom configuration for:
- Environment variable injection
- Path aliases
- Development server settings

## 🎯 Usage

1. **Enter a GitHub repository URL** (e.g., `facebook/react`)
2. **Wait for analysis** - The AI will analyze the repository structure
3. **Explore generated content** - Browse cards with examples and documentation
4. **Use the assistant** - Ask questions via text or voice
5. **Generate diagrams** - Create architecture visualizations
6. **Save projects** - Store analyzed repositories for later reference

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