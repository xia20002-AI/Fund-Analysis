import React from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  type: 'return' | 'risk' | 'ratio' | 'volatility';
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '%',
  type,
  description,
}) => {
  // 根据类型和数值确定颜色
  const getColor = () => {
    switch (type) {
      case 'return':
        return value >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
      case 'risk':
        return 'text-red-600 bg-red-50';
      case 'ratio':
        return value >= 1 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50';
      case 'volatility':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'return':
        return value >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />;
      case 'risk':
        return <TrendingDown size={24} />;
      case 'ratio':
        return <Activity size={24} />;
      case 'volatility':
        return <BarChart3 size={24} />;
    }
  };

  const formattedValue = type === 'ratio'
    ? value.toFixed(2)
    : (value * 100).toFixed(2);

  return (
    <div className={`p-4 rounded-lg ${getColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {getIcon()}
      </div>
      <div className="text-2xl font-bold">
        {formattedValue}{unit}
      </div>
      {description && (
        <div className="text-xs mt-1 opacity-70">{description}</div>
      )}
    </div>
  );
};
