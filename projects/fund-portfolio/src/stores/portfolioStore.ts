import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioConfig, AnalysisResult } from '../core/types';

interface PortfolioState {
  currentConfig: PortfolioConfig | null;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  
  // Actions
  setCurrentConfig: (config: PortfolioConfig) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setIsAnalyzing: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      currentConfig: null,
      analysisResult: null,
      isAnalyzing: false,
      error: null,
      
      setCurrentConfig: (config) => set({ currentConfig: config }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'fund-portfolio-storage',
      partialize: (state) => ({
        currentConfig: state.currentConfig,
        analysisResult: state.analysisResult,
      }),
    }
  )
);
