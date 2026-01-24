import { useState } from 'react';
import { generateBiopsyPayload, BiopsyPayload } from '../utils/biopsyEngine';
import { fullGenerationFlow } from '../services/v41Service';

export const useV41Upload = (userId: string, tier: string = 'USER') => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const processImage = async (
    file: File,
    sliderConfig: Record<string, number>,
    preset?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Step 1: Generate biopsy
      setCurrentStep('Generando biopsia quirúrgica...');
      const biopsyPayload = await generateBiopsyPayload(file);
      console.log('[Upload v41] Biopsy generated');
      
      // Step 2: Full flow
      setCurrentStep('Analizando imagen...');
      const flowResult = await fullGenerationFlow(
        userId,
        biopsyPayload,
        sliderConfig,
        preset
      );
      
      if (flowResult.success) {
        setResult(flowResult);
        setCurrentStep('¡Completado!');
        return flowResult;
      } else {
        throw new Error(flowResult.error || 'Generation failed');
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('[Upload v41] Error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setResult(null);
    setError(null);
    setCurrentStep('');
  };
  
  return {
    isProcessing,
    currentStep,
    result,
    error,
    processImage,
    reset
  };
};