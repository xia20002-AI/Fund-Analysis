import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { FundInfo } from '../../core/types';
import { WebDataSource } from '../../data/source';

interface FundSearchProps {
  onSelect: (fund: FundInfo) => void;
  disabled?: boolean;
}

export const FundSearch: React.FC<FundSearchProps> = ({ onSelect, disabled }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<FundInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dataSource = new WebDataSource();
  
  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2) {
        searchFunds();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);
  
  const searchFunds = async () => {
    setLoading(true);
    try {
      const funds = await dataSource.searchFunds(keyword);
      setResults(funds);
      setShowDropdown(true);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelect = (fund: FundInfo) => {
    onSelect(fund);
    setKeyword('');
    setResults([]);
    setShowDropdown(false);
  };
  
  return (
    <div className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入基金代码或名称"
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2">加载中...</span>}
      </div>
      
      {/* 下拉结果 */}
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((fund) => (
            <li
              key={fund.code}
              onClick={() => handleSelect(fund)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
            >
              <span>{fund.code} - {fund.name}</span>
              <span className="text-gray-500 text-sm">{fund.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
