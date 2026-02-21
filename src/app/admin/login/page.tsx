'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (password !== '123') {
      setError('Invalid password');
      return;
    }

    // 🔥 správný klíč
    localStorage.setItem('admin_token', 'valid-admin-token');

    router.push('/admin');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded shadow-lg">
        <h1 className="text-xl mb-4">Admin Login</h1>

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 bg-gray-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-400 mb-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
