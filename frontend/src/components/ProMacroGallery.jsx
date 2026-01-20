import React from 'react';
import { motion } from 'framer-motion';

const MACROS = [
    { key: 'macro_restoration', title: 'Restauración', desc: 'Modo Forense. Recupera fotos dañadas.', icon: '🛠️' },
    { key: 'macro_fidelity', title: 'Fidelidad', desc: 'Hiperrealismo digital. 4K/8K.', icon: '🔍' },
    { key: 'macro_character', title: 'Carácter', desc: 'Look analógico y vintage.', icon: '🎞️' },
    { key: 'macro_presence', title: 'Presencia', desc: 'Retrato beauty. Piel perfecta.', icon: '👤' },
    { key: 'macro_polish', title: 'Pulido', desc: 'E-commerce y moda limpia.', icon: '🧼' },
    { key: 'macro_cinematic', title: 'Cinemática', desc: 'Color grading de película.', icon: '🎬' },
    { key: 'macro_volume', title: 'Volumen', desc: 'Luz Rembrandt tridimensional.', icon: '📐' },
    { key: 'macro_drama', title: 'Drama', desc: 'Alto contraste Noir.', icon: '🎭' },
    { key: 'macro_atmosphere', title: 'Atmósfera', desc: 'Niebla, rayos de luz, mood.', icon: '🌫️' },
];

export default function ProMacroGallery({ onSelect }) {
  return (
    <div className="p-8 h-full overflow-y-auto">
        <h2 className="text-2xl font-serif text-white mb-8">Recetas Profesionales</h2>
        <div className="grid grid-cols-3 gap-6">
            {MACROS.map((macro, idx) => (
                <motion.button
                    key={macro.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelect(macro.key)}
                    className="bg-card/50 border border-white/10 p-6 rounded-sm hover:bg-white/5 hover:border-primary/50 transition-all text-left group"
                >
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{macro.icon}</div>
                    <h3 className="text-lg font-medium text-white mb-2">{macro.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{macro.desc}</p>
                </motion.button>
            ))}
        </div>
    </div>
  );
}
