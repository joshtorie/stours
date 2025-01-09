import React from 'react';
import UserProfile from '../components/UserProfile';

const LoginPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <UserProfile />
      </div>
    </div>
  );
};

export default LoginPage;
