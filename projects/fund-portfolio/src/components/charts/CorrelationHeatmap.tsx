import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { CorrelationMatrix } from '../../core/types';

interface CorrelationHeatmapProps {
  matrix: CorrelationMatrix;
  height?: number;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  matrix,
  height = 300,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !matrix) return;

    chartInstance.current = echarts.init(chartRef.current);

    // 转换数据为 ECharts 热力图格式
    const data: [number, number, number][] = [];
    matrix.funds.forEach((_, i) => {
      matrix.funds.forEach((_, j) => {
        data.push([i, j, matrix.matrix[i][j]]);
      });
    });

    const option: echarts.EChartsOption = {
      title: {
        text: '相关性矩阵',
        left: 'center',
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const fund1 = matrix.funds[params.data[0]];
          const fund2 = matrix.funds[params.data[1]];
          const correlation = params.data[2];
          return `<div><strong>${fund1} vs ${fund2}</strong></div>
                  <div>相关系数: ${correlation.toFixed(3)}</div>`;
        },
      },
      grid: {
        height: '70%',
        top: '15%',
      },
      xAxis: {
        type: 'category',
        data: matrix.funds,
        splitArea: { show: true },
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'category',
        data: matrix.funds,
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#fef3c7', '#fcd34d', '#f59e0b', '#dc2626'],
        },
      },
      series: [{
        name: '相关性',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: (params: any) => params.data[2].toFixed(2),
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [matrix]);

  return <div ref={chartRef} style={{ height }} />;
};
