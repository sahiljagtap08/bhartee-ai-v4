// src/app/page.tsx
"use client"
import { useState } from 'react';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import { AlertCircle, Lock, User } from 'lucide-react';

const CREDENTIALS = {
  username: 'mvpbhartee',
  password: 'thisIsJustAnMVP'
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  if (isLoggedIn) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">
            Bhartee AI Interview
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <User className="w-4 h-4" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary/90 text-gray-900 rounded-lg font-medium transition-all duration-200"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>This is a demo version of Bhartee AI Interview platform.</p>
            <p>Please contact admin for credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}