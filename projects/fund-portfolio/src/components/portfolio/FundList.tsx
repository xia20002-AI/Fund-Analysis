import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { FundConfig } from '../../core/types';

interface FundListProps {
  funds: FundConfig[];
  onRemove: (code: string) => void;
  minFunds?: number;
}

export const FundList: React.FC<FundListProps> = ({ 
  funds, 
  onRemove, 
  minFunds = 2 
}) => {
  const showWarning = funds.length < minFunds;
  
  return (
    <div className="space-y-2">
      {/* 警告提示 */}
      {showWarning && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle size={16} />
          <span className="text-sm">请至少选择{minFunds}只基金进行分析</span>
        </div>
      )}
      
      {/* 基金列表 */}
      {funds.length === 0 ? (
        <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-lg">
          尚未添加基金
        </div>
      ) : (
        <ul className="space-y-2">
          {funds.map((fund) => (
            <li 
              key={fund.code}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">{fund.name}</div>
                <div className="text-sm text-gray-500">{fund.code}</div>
              </div>
              <button
                onClick={() => onRemove(fund.code)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {/* 统计 */}
      <div className="text-sm text-gray-500 text-right">
        已选择 {funds.length} 只基金
      </div>
    </div>
  );
};
