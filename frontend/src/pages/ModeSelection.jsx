import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown } from 'lucide-react';

export default function ModeSelection() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleModeSelect = async (mode) => {
    if (!user) {
      console.error("No user available");
      return;
    }
    
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/update-user-mode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, mode })
        });
        
        if (response.ok) {
          navigate('/dashboard');
        } else {
          console.error("Failed to update user mode - server error");
        }
    } catch (e) {
        console.error("Failed to set mode", e);
    }
  };

  // Show loading state while auth is loading
  if (loading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if no user
  if (!user) {
    navigate('/login');
    return null;
  }

  const modes = [
    {
      id: 'user',
      title: 'USER MODE',
      icon: <Zap size={32} />,
      desc: 'Rápido, eficiente. Ideal para pruebas y uso casual.',
      model: 'Gemini 2.5 Flash',
      color: 'border-blue-500/50 hover:border-blue-500',
      text: 'text-blue-500'
    },
    {
      id: 'pro',
      title: 'PRO MODE',
      icon: <Sparkles size={32} />,
      desc: 'Equilibrio perfecto. Calidad profesional para uso diario.',
      model: 'Gemini Standard',
      color: 'border-yellow-500/50 hover:border-yellow-500',
      text: 'text-yellow-500'
    },
    {
      id: 'prolux',
      title: 'PROLUX MODE',
      icon: <Crown size={32} />,
      desc: 'Máxima fidelidad. El poder absoluto de Gemini 3 Pro.',
      model: 'Gemini 3 Pro',
      color: 'border-purple-500/50 hover:border-purple-500',
      text: 'text-purple-500'
    }
  ];

  return (
    <Layout>
      <div className="h-screen flex flex-col items-center justify-center p-8">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
        >
            <h1 className="text-4xl font-serif text-white mb-4">Selecciona tu Motor</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-xs">LuxScaler v27 // Configuración Inicial</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
            {modes.map((mode, idx) => (
                <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleModeSelect(mode.id)}
                    className={`group relative p-8 bg-card/40 backdrop-blur-sm border ${mode.color} transition-all duration-300 hover:bg-white/5 text-left flex flex-col h-full`}
                >
                    <div className={`mb-6 ${mode.text} transition-transform group-hover:scale-110 duration-300`}>
                        {mode.icon}
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">{mode.title}</h3>
                    <p className="text-sm text-muted-foreground mb-8 flex-1">{mode.desc}</p>
                    
                    <div className="pt-6 border-t border-white/10 w-full">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Motor IA</span>
                        <p className={`text-xs font-mono mt-1 ${mode.text}`}>{mode.model}</p>
                    </div>
                </motion.button>
            ))}
        </div>
      </div>
    </Layout>
  );
}
