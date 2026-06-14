/**
 * Type patches for vendor libraries that have React 18 compatibility issues.
 * recharts v3 ships types that require @types/react ≥18.3; this file bridges
 * the gap without requiring a runtime upgrade.
 */

import type { ComponentType, ReactNode } from 'react';
import * as React from 'react';

declare module 'recharts' {
  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
    aspect?: number;
    debounce?: number;
    id?: string;
    className?: string;
    children?: ReactNode;
  }
  export class ResponsiveContainer extends React.Component<ResponsiveContainerProps> {}

  export interface PieChartProps {
    width?: number;
    height?: number;
    margin?: object;
    onClick?: (data: any, index: number, event: React.MouseEvent) => void;
    children?: ReactNode;
    [key: string]: any;
  }
  export class PieChart extends React.Component<PieChartProps> {}

  export interface BarChartProps {
    width?: number;
    height?: number;
    data?: any[];
    margin?: object;
    barSize?: number;
    maxBarSize?: number;
    stackOffset?: string;
    children?: ReactNode;
    [key: string]: any;
  }
  export class BarChart extends React.Component<BarChartProps> {}

  export interface LineChartProps {
    width?: number;
    height?: number;
    data?: any[];
    margin?: object;
    children?: ReactNode;
    [key: string]: any;
  }
  export class LineChart extends React.Component<LineChartProps> {}

  export interface AreaChartProps {
    width?: number;
    height?: number;
    data?: any[];
    margin?: object;
    children?: ReactNode;
    [key: string]: any;
  }
  export class AreaChart extends React.Component<AreaChartProps> {}

  export interface PieProps {
    cx?: string | number;
    cy?: string | number;
    innerRadius?: string | number;
    outerRadius?: string | number;
    startAngle?: number;
    endAngle?: number;
    data?: any[];
    dataKey?: string | number;
    nameKey?: string | number;
    label?: boolean | object | ReactNode | ((props: any) => ReactNode);
    labelLine?: boolean | object | ReactNode | ((props: any) => ReactNode);
    activeIndex?: number | number[];
    activeShape?: object | ReactNode | ((props: any) => ReactNode);
    fill?: string;
    stroke?: string;
    paddingAngle?: number;
    minAngle?: number;
    children?: ReactNode;
    [key: string]: any;
  }
  export class Pie extends React.Component<PieProps> {}

  export interface CellProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    [key: string]: any;
  }
  export class Cell extends React.Component<CellProps> {}

  export interface BarProps {
    dataKey: string | number;
    fill?: string;
    stroke?: string;
    stackId?: string | number;
    barSize?: number;
    maxBarSize?: number;
    children?: ReactNode;
    [key: string]: any;
  }
  export class Bar extends React.Component<BarProps> {}

  export interface LineProps {
    dataKey: string | number;
    stroke?: string;
    strokeWidth?: number;
    dot?: boolean | object | ReactNode | ((props: any) => ReactNode);
    activeDot?: boolean | object | ReactNode | ((props: any) => ReactNode);
    type?: string;
    children?: ReactNode;
    [key: string]: any;
  }
  export class Line extends React.Component<LineProps> {}

  export interface AreaProps {
    dataKey: string | number;
    stroke?: string;
    fill?: string;
    strokeWidth?: number;
    type?: string;
    children?: ReactNode;
    [key: string]: any;
  }
  export class Area extends React.Component<AreaProps> {}

  export interface XAxisProps {
    dataKey?: string | number;
    width?: number;
    height?: number;
    orientation?: 'bottom' | 'top';
    tick?: boolean | object | ReactNode | ((props: any) => ReactNode);
    tickLine?: boolean | object;
    tickFormatter?: (value: any, index: number) => string;
    axisLine?: boolean | object;
    label?: object | string | ReactNode;
    children?: ReactNode;
    [key: string]: any;
  }
  export class XAxis extends React.Component<XAxisProps> {}

  export interface YAxisProps {
    dataKey?: string | number;
    width?: number;
    height?: number;
    orientation?: 'left' | 'right';
    tick?: boolean | object | ReactNode | ((props: any) => ReactNode);
    tickFormatter?: (value: any, index: number) => string;
    children?: ReactNode;
    [key: string]: any;
  }
  export class YAxis extends React.Component<YAxisProps> {}

  export interface TooltipProps {
    content?: ReactNode | ((props: any) => ReactNode);
    formatter?: (value: any, name: string, props: any) => any;
    labelFormatter?: (label: any) => ReactNode;
    cursor?: boolean | object | ReactNode;
    [key: string]: any;
  }
  export class Tooltip extends React.Component<TooltipProps> {}

  export interface LegendProps {
    layout?: 'horizontal' | 'vertical';
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    formatter?: (value: any, entry: any, index: number) => ReactNode;
    content?: ReactNode | ((props: any) => ReactNode);
    [key: string]: any;
  }
  export class Legend extends React.Component<LegendProps> {}

  export interface CartesianGridProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    horizontal?: boolean | object;
    vertical?: boolean | object;
    horizontalPoints?: number[];
    verticalPoints?: number[];
    stroke?: string;
    strokeDasharray?: string;
    fill?: string;
    [key: string]: any;
  }
  export class CartesianGrid extends React.Component<CartesianGridProps> {}
}

// exceljs ships v4 without a proper declaration entry point in some installations
declare module 'exceljs' {
  const ExcelJS: any;
  export = ExcelJS;
}
