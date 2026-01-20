import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/modes'); // Changed redirect to Modes
    } else {
      alert('Login failed');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 border border-white/10 bg-card/50 backdrop-blur-md">
            <h1 className="text-4xl font-serif text-primary mb-2 text-center">LUXSCALER</h1>
            <p className="text-center text-muted-foreground text-xs uppercase tracking-[0.2em] mb-12">System v27.0 // Access</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Identifier</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-primary outline-none transition-all placeholder:text-white/10"
                        placeholder="USER ID"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Passcode</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-primary outline-none transition-all placeholder:text-white/10"
                        placeholder="••••••••"
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="w-full bg-white/5 border border-white/10 text-white font-semibold py-4 uppercase tracking-widest text-xs hover:bg-primary hover:text-black hover:border-primary transition-all mt-8"
                >
                    Initialize Session
                </button>
            </form>
        </div>
      </div>
    </Layout>
  );
}
