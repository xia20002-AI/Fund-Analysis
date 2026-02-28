import { create } from 'zustand';
import { PortfolioConfig, AnalysisResult } from '../core/types';

interface PortfolioState {
  // 当前配置
  currentConfig: PortfolioConfig | null;
  setCurrentConfig: (config: PortfolioConfig) => void;
  
  // 分析结果
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult) => void;
  
  // 加载状态
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  
  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  currentConfig: null,
  setCurrentConfig: (config) => set({ currentConfig: config }),
  
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),
  
  isAnalyzing: false,
  setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
  
  error: null,
  setError: (error) => set({ error }),
}));
