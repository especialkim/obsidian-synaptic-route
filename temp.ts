import { Chart, ChartConfiguration, ChartTypeRegistry } from 'chart.js/auto';
import { KeywordCloudData, ChartType } from './types';
import { SynapticRouteSettings } from './settings';
import { ObsidianUtils } from './obsidianUtils';

export class KeywordChart {
    private settings: SynapticRouteSettings;
    private obsidianUtils: ObsidianUtils;
    private options: any;
    chartBackgroundColorPattern: string[];
    chartBorderColorPattern: string[];

    constructor(settings: SynapticRouteSettings, options: any) {
        this.settings = settings;
        this.obsidianUtils = ObsidianUtils.getInstance();
        this.options = options;
        this.chartBackgroundColorPattern = ['#ff638455', '#36a2eb55', '#ffce5655', '#4bc0c055', '#9966ff55', '#ff9f4055'];
        this.chartBorderColorPattern = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'];
    }

    getChartHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {
        const canvasId = `keyword-chart-${Math.random().toString(36).substr(2, 9)}`;
        const html = `<div class="synaptic-route-container chart" style="width: 100%; height: 0; padding-bottom: 50%;"><canvas id="${canvasId}"></canvas></div>`;
        let labels: string[] = [];
        
        if(this.settings.keywordSelectionMethod === 'tags'){
            labels = arrKeywordCloudData.map(t => `#${t.displayName}`);
        } else {
            labels = arrKeywordCloudData.map(t => `#${t.displayName.slice(2)}`);
        }

        const vaultName = this.obsidianUtils.getVaultName();
        const links = arrKeywordCloudData.map(t => `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(t.displayName)}`);
        
        setTimeout(() => {
            this.createChart(canvasId, labels, arrKeywordCloudData, links);
        }, 100);

        return html;
    }

    private createChart(canvasId: string, labels: string[], arrKeywordCloudData: KeywordCloudData[], links: string[]) {
        const container = document.querySelector('.synaptic-route-container.chart') as HTMLElement;
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const chartType = this.options.chartType as ChartType;
        const ctx = canvas.getContext('2d');

        if (ctx && container) {
            const dpr = window.devicePixelRatio || 1;
            
            const updateCanvasSize = () => {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                canvas.width = containerWidth * dpr;
                canvas.height = containerHeight * dpr;
                canvas.style.width = `${containerWidth}px`;
                canvas.style.height = `${containerHeight}px`;
                ctx.scale(dpr, dpr);
            };

            let chart: Chart | null = null;

            const isCurrentThemeDark = () => document.body.classList.contains('theme-dark');

            Chart.defaults.color = isCurrentThemeDark() ? '#FFF' : '#000';

            if (this.options.theme === 'dark') {
                Chart.defaults.color = '#FFF';
            } else if (this.options.theme === 'light') {
                Chart.defaults.color = '#000';
            }

            const createOrUpdateChart = () => {
                updateCanvasSize();

                const currentColor = isCurrentThemeDark() ? '#E0E0E0' : '#333';
                const gridDefaultColor = isCurrentThemeDark() ? '#555' : '#CCC';
                const themeColor = this.options.theme === 'dark' ? '#E0E0E0' : 
                                   this.options.theme === 'light' ? '#333' : 
                                   currentColor;

                const gridColor = this.options.theme === 'dark' ? '#555' : 
                                   this.options.theme === 'light' ? '#CCC' : 
                                   gridDefaultColor;

                const chartConfig: ChartConfiguration = {
                    type: chartType as keyof ChartTypeRegistry,
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Keywords Ranking',
                            data: arrKeywordCloudData.map(t => t.score),
                            backgroundColor: this.chartBackgroundColorPattern,
                            borderColor: this.chartBorderColorPattern,
                            borderWidth: 3,
                            links: links
                        } as any]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        devicePixelRatio: dpr,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Keywords Ranking',
                                color: themeColor,
                                font: {
                                    size: 18,
                                    weight: 'bold',
                                    family: "Pretendard Variable"
                                }
                            }
                        },
                        layout: {
                            padding: {
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 10
                            }
                        },
                        ...(chartType === 'bar' && {
                            scales: {
                                x: {
                                    grid: {
                                        color: gridColor  
                                    },
                                    ticks: {
                                        color: themeColor,
                                        font: {
                                            size: 13,
                                            weight: 'normal',
                                            family: "Pretendard Variable"
                                        }
                                    }
                                },
                                y: {
                                    grid: {
                                        color: gridColor 
                                    },
                                    ticks: {
                                        color: themeColor,
                                        font: {
                                            size: 13,
                                            weight: 'normal',
                                            family: "Pretendard Variable"
                                        }
                                    }
                                }
                            }
                        }),
                        onClick: async (event, elements) => {
                            if (elements.length > 0 && chartConfig.data.labels) {
                                const elementIndex = elements[0].index;
                                let label = chartConfig.data.labels[elementIndex];
                                const link = (chartConfig.data.datasets[0] as any).links[elementIndex];
                                
                                if(this.settings.keywordSelectionMethod === 'fileNamePrefix'){
                                    label = (label as string).slice(1);
                                    label = this.settings.keywordSelectionInput + label;

                                    if(this.obsidianUtils.isExistLink(label as string)){
                                        const tFile = this.obsidianUtils.getTFileFromLinkDisplayName(label as string);
                                        if(tFile) this.obsidianUtils.openFileFromTFile(tFile);
                                    }else{
                                        const tFile = await this.obsidianUtils.createLink(label as string);
                                        this.obsidianUtils.openFileFromTFile(tFile);
                                    }
                                }
                            }
                        }
                    }
                };

                if (chart) {
                    chart.destroy();
                }
                chart = new Chart(ctx, chartConfig);
            };

            const debounce = (func: Function, wait: number) => {
                let timeout: NodeJS.Timeout | null = null;
                return function(...args: any[]) {
                    const later = () => {
                        timeout = null;
                        func(...args);
                    };
                    if (timeout) clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            const debouncedCreateOrUpdateChart = debounce(createOrUpdateChart, 250);

            const resizeObserver = new ResizeObserver(() => {
                if (chart) {
                    debouncedCreateOrUpdateChart();
                }
            });
            resizeObserver.observe(container);

            const intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        createOrUpdateChart();
                    }
                });
            }, { threshold: 0.1 });

            intersectionObserver.observe(container);

            createOrUpdateChart();
        }
    }
}

