import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface User {
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro';
}

interface UserDropdownProps {
  user?: User;
  onSettings: () => void;
  onBilling: () => void;
  onSignOut: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ 
  user, 
  onSettings, 
  onBilling, 
  onSignOut 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition-colors"
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{user.name}</span>
            {user.plan === 'pro' && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                PRO
              </span>
            )}
          </div>
          <span className="text-gray-400 text-xs">{user.email}</span>
        </div>
        
        <Icon 
          icon="chevron-down" 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-12 h-12 rounded-full ring-2 ring-white/20"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{user.name}</span>
                  {user.plan === 'pro' ? (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                      PRO
                    </span>
                  ) : (
                    <span className="bg-gray-600/50 text-gray-300 text-xs px-2 py-1 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                onSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
                <Icon icon="settings" className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">Settings</div>
                <div className="text-xs text-gray-500">API keys, preferences</div>
              </div>
            </button>

            <button
              onClick={() => {
                onBilling();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Icon icon="credit-card" className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">Billing & Usage</div>
                <div className="text-xs text-gray-500">Manage subscription</div>
              </div>
            </button>

            {user.plan === 'free' && (
              <button
                onClick={() => {
                  onBilling();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-colors border-t border-white/5"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Icon icon="crown" className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Upgrade to Pro</div>
                  <div className="text-xs text-purple-400">Unlock all features</div>
                </div>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-white/10 py-2">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Icon icon="logout" className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">Sign Out</div>
                <div className="text-xs text-red-500">End your session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;