import { useState, useEffect } from 'react';
import type { FundConfig, WeightMode } from '../../core/types';

interface WeightConfigProps {
  funds: Array<FundConfig & Record<string, any>>;
  onChange: (funds: Array<FundConfig & Record<string, any>>) => void;
}

export const WeightConfig: React.FC<WeightConfigProps> = ({ funds, onChange }) => {
  const [mode, setMode] = useState<WeightMode>('equal');
  
  // 等权重模式
  const applyEqualWeight = () => {
    const weight = funds.length > 0 ? 1 / funds.length : 0;
    const newFunds = funds.map(f => ({ ...f, weight }));
    onChange(newFunds);
  };
  
  // 自定义权重变化
  const handleWeightChange = (code: string, weight: number) => {
    const newFunds = funds.map(f => 
      f.code === code ? { ...f, weight: weight / 100 } : f
    );
    onChange(newFunds);
  };
  
  // 计算总权重
  const totalWeight = funds.reduce((sum, f) => sum + f.weight, 0);
  const isValid = Math.abs(totalWeight - 1) < 0.001;
  
  useEffect(() => {
    if (mode === 'equal' && funds.length > 0) {
      applyEqualWeight();
    }
  }, [mode, funds.length]);
  
  return (
    <div className="space-y-4">
      {/* 模式选择 */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('equal')}
          className={`px-4 py-2 rounded ${mode === 'equal' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          等权重
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-4 py-2 rounded ${mode === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          自定义
        </button>
      </div>
      
      {/* 权重列表 */}
      <div className="space-y-2">
        {funds.map((fund) => (
          <div key={fund.code} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{fund.name}</div>
              <div className="text-sm text-gray-500">{fund.code}</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={(fund.weight * 100).toFixed(2)}
                onChange={(e) => handleWeightChange(fund.code, parseFloat(e.target.value))}
                disabled={mode === 'equal'}
                className="w-20 px-2 py-1 border rounded text-right"
              />
              <span>%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 总权重显示 */}
      <div className={`text-right font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
        总权重: {(totalWeight * 100).toFixed(2)}%
        {!isValid && <span className="text-sm ml-2">(必须为100%)</span>}
      </div>
    </div>
  );
};
