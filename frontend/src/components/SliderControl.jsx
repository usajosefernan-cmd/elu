import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from './ui/slider';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

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
    <div className={`mb-6 p-4 rounded-sm border border-white/5 bg-black/20 ${disabled ? 'opacity-40 pointer-events-none' : ''} hover:bg-white/5 transition-colors`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <label className="text-sm uppercase tracking-wide text-white font-medium">
                {slider.label || slider.name}
                </label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info size={12} className="text-muted-foreground hover:text-primary transition-colors"/>
                        </TooltipTrigger>
                        <TooltipContent className="bg-card border border-white/10 text-xs max-w-[200px]">
                            <p>{slider.snippet}</p> {/* Show raw snippet in tooltip for advanced users */}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{slider.description}</p>
        </div>
        
        <div className="text-right">
          <span className={`text-[10px] font-mono mr-2 px-1.5 py-0.5 rounded-sm bg-white/5 ${levelColors[slider.levelText]}`}>
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
        className="my-3 py-2"
      />
      
      {/* Friendly State Feedback - Optional, can replace snippet */}
      {/* <div className="min-h-[1.5em]">
        <p className="text-[10px] text-primary/80 leading-relaxed font-mono">
             {slider.levelText === 'OFF' ? 'Desactivado' : slider.snippet}
        </p>
      </div> */}
    </div>
  );
}
