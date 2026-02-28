import React, { useState } from 'react';
import { QuickTimeRange } from '../../core/types';

interface TimeRangeSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  minDate?: string; // 最早可选择的日期（基金成立日）
}

const QUICK_OPTIONS: { label: string; value: QuickTimeRange }[] = [
  { label: '近1年', value: '1y' },
  { label: '近3年', value: '3y' },
  { label: '近5年', value: '5y' },
  { label: '今年以来', value: 'ytd' },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  startDate,
  endDate,
  onChange,
  minDate,
}) => {
  const [customMode, setCustomMode] = useState(false);
  
  const handleQuickSelect = (range: QuickTimeRange) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '3y':
        start.setFullYear(end.getFullYear() - 3);
        break;
      case '5y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      case 'ytd':
        start.setMonth(0, 1);
        break;
    }
    
    onChange(formatDate(start), formatDate(end));
    setCustomMode(false);
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  return (
    <div className="space-y-4">
      {/* 快捷选项 */}
      <div className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleQuickSelect(opt.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setCustomMode(!customMode)}
          className={`px-4 py-2 rounded text-sm ${customMode ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          自定义
        </button>
      </div>
      
      {/* 自定义日期选择 */}
      {customMode && (
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              min={minDate}
              max={endDate}
              onChange={(e) => onChange(e.target.value, endDate)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <span className="text-gray-400">至</span>
          <div>
            <label className="block text-sm text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={formatDate(new Date())}
              onChange={(e) => onChange(startDate, e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
        </div>
      )}
      
      {/* 当前选择显示 */}
      <div className="text-sm text-gray-600">
        分析区间: {startDate} 至 {endDate}
      </div>
    </div>
  );
};
