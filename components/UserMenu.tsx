import React, { useState } from 'react';
import Icon from './Icon';

interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    plan: 'free' | 'pro';
  };
  onSignIn: () => void;
  onSignOut: () => void;
  onSettings: () => void;
  onBilling: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  onSignIn, 
  onSignOut, 
  onSettings, 
  onBilling 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Icon icon="user" className="w-4 h-4" />
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
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
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="hidden sm:block text-left">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{user.name}</span>
            {user.plan === 'pro' && (
              <Icon icon="crown" className="w-4 h-4 text-yellow-400" />
            )}
          </div>
          <span className="text-gray-400 text-xs">{user.email}</span>
        </div>
        
        <Icon icon="chevron-down" className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{user.name}</span>
                    {user.plan === 'pro' ? (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                        PRO
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                        FREE
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  onSettings();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon icon="settings" className="w-4 h-4" />
                Settings
              </button>

              <button
                onClick={() => {
                  onBilling();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon icon="credit-card" className="w-4 h-4" />
                Billing
              </button>

              {user.plan === 'free' && (
                <button
                  onClick={() => {
                    onBilling();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                >
                  <Icon icon="crown" className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              )}
            </div>

            <div className="border-t border-white/10 py-2">
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Icon icon="logout" className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;