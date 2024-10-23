import { ChartType as ChartJSType, ChartTypeRegistry } from 'chart.js/auto';

export type SynapticRouteType = 'wordcloud' | 'chart' | 'table';
export type ChartType = keyof ChartTypeRegistry;
export type Theme = 'dark' | 'light' | 'default';

export interface SynapticRouteOptions {
    type: SynapticRouteType;
    chartType: ChartType;
    global: boolean;
    maxItem: number;
    maxRandomItem: number;
    theme: Theme;
}

export interface SyntaxError {
    key: string;
    value: string;
    message: string;
}
