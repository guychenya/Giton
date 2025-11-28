import React from 'react';

interface LogoProps {
  onClick: () => void;
}

const Logo: React.FC<LogoProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Go to homepage and reset filters"
      className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-purple-400 rounded-lg p-1 -m-1"
    >
      <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#c084fc' }} />
              <stop offset="50%" style={{ stopColor: '#ec4899' }} />
              <stop offset="100%" style={{ stopColor: '#60a5fa' }} />
            </linearGradient>
          </defs>
          <path
            d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 21L16.65 16.65"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
           <path 
            d="M11 8V14" 
            stroke="url(#logo-gradient)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M8 11H14" 
            stroke="url(#logo-gradient)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="hidden sm:inline text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-blue-300 group-hover:opacity-80 transition-opacity">
        GitExplore AI
      </span>
    </button>
  );
};

export default Logo;