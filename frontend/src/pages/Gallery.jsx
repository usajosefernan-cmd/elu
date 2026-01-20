import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MOCK_GALLERY = [
    { id: 1, src: "https://images.pexels.com/photos/34840277/pexels-photo-34840277.jpeg", title: "Neon Sunset", date: "2026-01-20" },
    { id: 2, src: "https://images.pexels.com/photos/18435276/pexels-photo-18435276.jpeg", title: "Architectural Void", date: "2026-01-19" },
    { id: 3, src: "https://images.pexels.com/photos/34472753/pexels-photo-34472753.jpeg", title: "Portrait Study 04", date: "2026-01-18" },
    { id: 4, src: "https://images.pexels.com/photos/7005050/pexels-photo-7005050.jpeg", title: "Golden Hour", date: "2026-01-18" },
    { id: 5, src: "https://images.pexels.com/photos/33018574/pexels-photo-33018574.jpeg", title: "Forenisc Restoration", date: "2026-01-15" },
    { id: 6, src: "https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg", title: "Cyberpunk City", date: "2026-01-10" },
];

export default function Gallery() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-[#020204] p-8 md:p-12">
        <header className="flex items-center justify-between mb-16">
            <div>
                <h1 className="text-4xl font-serif text-white mb-2">Archivo Personal</h1>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">LuxScaler v27 // Vault</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Volver al Estudio
            </button>
        </header>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {MOCK_GALLERY.map((item, idx) => (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="break-inside-avoid relative group cursor-pointer"
                >
                    <div className="overflow-hidden rounded-sm border border-white/10 bg-card">
                        <img src={item.src} alt={item.title} className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                            <h3 className="text-lg font-serif text-white">{item.title}</h3>
                            <p className="text-[10px] font-mono text-primary">{item.date}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </Layout>
  );
}
