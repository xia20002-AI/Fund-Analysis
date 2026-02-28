import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { DrawdownPoint } from '../../core/types';

interface DrawdownChartProps {
  drawdownData: DrawdownPoint[];
  maxDrawdownStart?: string;
  maxDrawdownEnd?: string;
  height?: number;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  drawdownData,
  maxDrawdownStart,
  maxDrawdownEnd,
  height = 300,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartInstance.current = echarts.init(chartRef.current);
    
    // 找出最大回撤点
    const maxDrawdownPoint = drawdownData.find(d => d.isMaxDrawdown);
    
    const option: echarts.EChartsOption = {
      title: {
        text: '动态回撤',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<div><strong>${p.axisValue}</strong></div>
                  <div>回撤: ${p.value}%</div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: drawdownData.map(d => d.date),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '回撤(%)',
        axisLabel: {
          formatter: '{value}%',
        },
        max: 0,
      },
      series: [
        {
          name: '回撤',
          type: 'line',
          data: drawdownData.map(d => (d.drawdown * 100).toFixed(2)),
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#ef4444' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.5)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.1)' },
            ]),
          },
          markLine: maxDrawdownPoint ? {
            data: [
              {
                xAxis: maxDrawdownPoint.date,
                label: {
                  formatter: '最大回撤',
                  position: 'end',
                },
                lineStyle: { color: '#dc2626', type: 'solid', width: 2 },
              },
            ],
          } : undefined,
        },
      ],
    };
    
    chartInstance.current.setOption(option);
    
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [drawdownData, maxDrawdownStart, maxDrawdownEnd]);
  
  return <div ref={chartRef} style={{ height }} />;
};
