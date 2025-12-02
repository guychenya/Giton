import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { getUserPlan } from '../lib/usage';
import Icon from './Icon';

const UserBadge: React.FC = () => {
  const userPlan = getUserPlan();
  
  return (
    <div className="relative">
      <UserButton afterSignOutUrl="/" />
      {userPlan === 'pro' && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
          <Icon icon="crown" className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

export default UserBadge;
