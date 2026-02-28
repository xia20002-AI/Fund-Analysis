import React, { useState } from 'react';
import { FundInfo, PortfolioConfig, WeightMode } from '../../core/types';
import { FundSearch } from './FundSearch';
import { FundList } from './FundList';
import { WeightConfig } from './WeightConfig';
import { TimeRangeSelector } from './TimeRangeSelector';

interface ConfigPanelProps {
  onAnalyze: (config: PortfolioConfig) => void;
  loading?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onAnalyze, loading }) => {
  const [funds, setFunds] = useState<Array<FundInfo & { weight: number }>>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 添加基金
  const handleAddFund = (fund: FundInfo) => {
    if (funds.find(f => f.code === fund.code)) {
      alert('该基金已在组合中');
      return;
    }
    setFunds([...funds, { ...fund, weight: 0 }]);
  };
  
  // 移除基金
  const handleRemoveFund = (code: string) => {
    setFunds(funds.filter(f => f.code !== code));
  };
  
  // 更新权重
  const handleWeightChange = (newFunds: Array<FundInfo & { weight: number }>) => {
    setFunds(newFunds);
  };
  
  // 检查是否可以分析
  const canAnalyze = () => {
    if (funds.length < 2) return false;
    const totalWeight = funds.reduce((sum, f) => sum + f.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) return false;
    if (!startDate || !endDate) return false;
    return true;
  };
  
  // 执行分析
  const handleAnalyze = () => {
    if (!canAnalyze()) return;
    
    const config: PortfolioConfig = {
      id: Date.now().toString(),
      name: `组合_${new Date().toLocaleDateString()}`,
      funds: funds.map(f => ({
        code: f.code,
        name: f.name,
        weight: f.weight,
      })),
      startDate,
      endDate,
    };
    
    onAnalyze(config);
  };
  
  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">组合配置</h2>
      
      {/* 基金搜索 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">添加基金</h3>
        <FundSearch onSelect={handleAddFund} />
      </section>
      
      {/* 已选基金 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">已选基金</h3>
        <FundList 
          funds={funds} 
          onRemove={handleRemoveFund}
        />
      </section>
      
      {/* 权重配置 */}
      {funds.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-700 mb-2">权重配置</h3>
          <WeightConfig funds={funds} onChange={handleWeightChange} />
        </section>
      )}
      
      {/* 时间范围 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-2">分析区间</h3>
        <TimeRangeSelector
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </section>
      
      {/* 分析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze() || loading}
        className={`w-full py-3 rounded-lg font-medium ${
          canAnalyze() && !loading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? '分析中...' : '开始分析'}
      </button>
    </div>
  );
};
