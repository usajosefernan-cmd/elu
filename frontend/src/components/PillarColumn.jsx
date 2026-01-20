import React from 'react';
import { Switch } from './ui/switch';
import SliderControl from './SliderControl';
import { motion } from 'framer-motion';

export default function PillarColumn({ pillar, onToggle, onSliderUpdate }) {
  const isAuto = pillar.mode === 'auto';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full border-r border-white/5 last:border-r-0 px-6 py-8 bg-[#020204]"
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <h2 className="text-2xl font-serif text-white tracking-tight">
          {pillar.pillarName.toUpperCase()}
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-xs tracking-widest ${isAuto ? 'text-primary' : 'text-muted-foreground'}`}>
            {isAuto ? 'AUTO' : 'OFF'}
          </span>
          <Switch 
            checked={isAuto}
            onCheckedChange={(checked) => onToggle(pillar.pillarName, checked ? 'auto' : 'off')}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
        <div className="space-y-1">
          {pillar.sliders.map((slider) => (
            <SliderControl 
              key={slider.name} 
              slider={slider} 
              pillarName={pillar.pillarName}
              onUpdate={onSliderUpdate}
              disabled={!isAuto}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
