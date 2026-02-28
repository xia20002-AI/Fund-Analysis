import React from 'react';
import { ConfigPanel } from './components/portfolio/ConfigPanel';
import { ResultPanel } from './sections/ResultPanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ErrorToast } from './components/common/ErrorToast';
import { useAnalysis } from './hooks/useAnalysis';
import { usePortfolioStore } from './stores/portfolioStore';

function App() {
  const { runAnalysis } = useAnalysis();
  const { error, clearError, isAnalyzing } = usePortfolioStore();
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">基金组合分析平台</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧配置面板 */}
            <div className="lg:col-span-1">
              <ConfigPanel onAnalyze={runAnalysis} loading={isAnalyzing} />
            </div>
            
            {/* 右侧结果面板 */}
            <div className="lg:col-span-2">
              <ResultPanel />
            </div>
          </div>
        </main>
        
        {/* 错误提示 */}
        {error && <ErrorToast message={error} onClose={clearError} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
