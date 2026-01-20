import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from './ui/slider';

const levelColors = {
  'OFF': 'text-muted-foreground',
  'LOW': 'text-blue-400',
  'MED': 'text-yellow-400',
  'HIGH': 'text-orange-500',
  'FORCE': 'text-red-500 font-bold'
};

export default function SliderControl({ slider, pillarName, onUpdate, disabled }) {
  const handleChange = (vals) => {
    onUpdate(pillarName, slider.name, vals[0]);
  };

  return (
    <div className={`mb-6 p-4 rounded-sm border border-white/5 bg-black/20 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-end mb-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          {slider.name.replace(/_/g, ' ')}
        </label>
        <div className="text-right">
          <span className={`text-xs font-mono mr-2 ${levelColors[slider.levelText]}`}>
            {slider.levelText}
          </span>
          <span className="text-sm font-mono text-primary">{slider.value}</span>
        </div>
      </div>
      
      <Slider
        defaultValue={[slider.value]}
        value={[slider.value]}
        max={10}
        step={1}
        onValueChange={handleChange}
        className="my-3"
      />
      
      <div className="min-h-[2.5em]">
        <p className="text-[10px] text-muted-foreground leading-relaxed font-mono italic">
          "{slider.snippet}"
        </p>
      </div>
    </div>
  );
}
