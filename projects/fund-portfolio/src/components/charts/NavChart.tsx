import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { NavPoint } from '../../core/types';

interface NavChartProps {
  portfolioNav: NavPoint[];
  benchmarkNav?: NavPoint[];
  benchmarkName?: string;
  height?: number;
}

export const NavChart: React.FC<NavChartProps> = ({
  portfolioNav,
  benchmarkNav,
  benchmarkName = '基准',
  height = 400,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);
    
    const option: echarts.EChartsOption = {
      title: {
        text: '净值走势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let html = `<div><strong>${date}</strong></div>`;
          params.forEach((p: any) => {
            html += `<div>${p.marker} ${p.seriesName}: ${p.value}%</div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['组合', benchmarkNav ? benchmarkName : []].flat(),
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: portfolioNav.map(p => p.date),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '收益率(%)',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '组合',
          type: 'line',
          data: portfolioNav.map(p => (p.return * 100).toFixed(2)),
          smooth: true,
          lineStyle: { width: 3 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ]),
          },
        },
        ...(benchmarkNav ? [{
          name: benchmarkName,
          type: 'line' as const,
          data: benchmarkNav.map(p => (p.return * 100).toFixed(2)),
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' as const },
          itemStyle: { color: '#9ca3af' },
        }] : []),
      ],
    };
    
    chartInstance.current.setOption(option);
    
    // 响应式
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [portfolioNav, benchmarkNav, benchmarkName]);
  
  return <div ref={chartRef} style={{ height }} />;
};
