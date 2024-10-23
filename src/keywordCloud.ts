import { MarkdownPostProcessorContext, TFile } from 'obsidian';
import { ChartType, SynapticRouteOptions } from './types';
import { ObsidianUtils } from './obsidianUtils';
import { SynapticRouteSettings, DEFAULT_SETTINGS, SynapticRouteSettingTab } from './settings';
import { Chart, ChartConfiguration, ChartTypeRegistry} from 'chart.js/auto';


interface MatchedKeyword {
    path: string;
    keywordsType: string;
    keywords: string[];
    hasKeywords: boolean;
}

interface KeywordCloudData {
    keywordType: string;
    displayName: string;
    fileName: string;
    rank: number;
    score: number;
    backlinkCountType: string;
    backlinkCount: number;
    cloudFactor: string;
}


export class KeywordCloud {
    private settings: SynapticRouteSettings;
    private el: HTMLElement;
    private ctx: MarkdownPostProcessorContext;
    private obsidianUtils: ObsidianUtils;
    private options: SynapticRouteOptions;
    chartBackgroundColorPattern: string[];
    chartBorderColorPattern: string[];

    constructor(el: HTMLElement, ctx: MarkdownPostProcessorContext, settings: SynapticRouteSettings, options: SynapticRouteOptions) {
        this.settings = settings;
        this.el = el;
        this.ctx = ctx;
        this.obsidianUtils = ObsidianUtils.getInstance();
        this.options = options;
        this.chartBackgroundColorPattern = ['#ff638455', '#36a2eb55', '#ffce5655', '#4bc0c055', '#9966ff55', '#ff9f4055']
        this.chartBorderColorPattern = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
    }

    /* Main Functions*/

    process() {
        try {

            // 현재 경로에서 한 단계 깊이의 경로를 저장할 배열
            let arrPathOfOneDepthFromCurrentPath: string[] = [];
            
            // 전역 옵션이 설정된 경우 볼트의 모든 경로를 가져옴
            if(this.options.global){
                arrPathOfOneDepthFromCurrentPath = this.obsidianUtils.getAllPathOfVault();
            }else{
                // 현재 소스 경로에서 한 단계 깊이의 경로를 가져옴
                arrPathOfOneDepthFromCurrentPath = this.obsidianUtils.getArrPathOfOneDepthFromPath(this.ctx.sourcePath);
                
                // Lucy Zettelkasten 옵션이 활성화된 경우
                if(this.settings.lucyZettelkastenEnabled){
                    // 문헌 카드 경로를 가져옴
                    const arrPathofLiterature = this.getArrPathOfLiteratureCardFromArrayPath(arrPathOfOneDepthFromCurrentPath);
                    // 문헌 카드 경로에서 한 단계 깊이의 경로를 가져옴
                    const arrPathofOneDepthFromArrPathOfLiterature = this.obsidianUtils.getArrayPathOfOneDepthFromArrPath(arrPathofLiterature);
                    // 메인 카드 경로를 가져옴
                    const arrPathofMainCard = this.getArrPathOfMainCardFromArrayPath(arrPathofOneDepthFromArrPathOfLiterature);
                    // 기존 경로에 메인 카드 경로를 추가
                    arrPathOfOneDepthFromCurrentPath = arrPathOfOneDepthFromCurrentPath.concat(arrPathofMainCard);
                }
            }
            // 필터 옵션을 적용하여 경로 배열을 필터링
            arrPathOfOneDepthFromCurrentPath = this.executeFilterOption(arrPathOfOneDepthFromCurrentPath);
            arrPathOfOneDepthFromCurrentPath.push(this.ctx.sourcePath);

            // 매칭된 키워드 객체 배열을 생성하고 키워드가 있는 항목만 필터링
            const arrObjMatchedKeyword = this.getArrObjMatchedKeywordFromArrPath(arrPathOfOneDepthFromCurrentPath)
                .filter(t => t.hasKeywords)

            // 키워드 배열을 평탄화하여 생성
            const keywords : string[] = arrObjMatchedKeyword.map(t => t.keywords).flat();

            // 키워드 클라우드 데이터 배열을 생성 (cloudFactor 없이)
            const arrKeywordCloudDataWithOutCloudFactor = this.getArrKeywordCloudWithoutCloudFactorFromArrNameOfKeyword(keywords);
            // cloudFactor를 포함한 최종 키워드 클라우드 데이터 배열을 생성
            const arrKeywordCloudData = this.getArrKeywordCloudDataFromArrNameOfKeyword(arrKeywordCloudDataWithOutCloudFactor);
            // 키워드 클라우드 데이터를 사용하여 HTML을 렌더링
            const renderedHTML = this.render(arrKeywordCloudData)

            // 부모 요소에 테마 클래스를 추가하면서 기존 클래스를 유지
            this.el.classList.add(this.options.theme);
            this.el.className = this.el.className.toLowerCase();
            // 렌더링된 HTML을 요소에 삽입
            this.el.innerHTML = renderedHTML;

        } catch (error) {
            console.error("Error rendering keyword cloud:", error);
            this.el.empty();
            this.el.createEl('div', { 
                text: 'Error rendering keyword cloud. Please check the console for details.',
                cls: 'keyword-cloud-error'
            });
        }
    }

    /* Sub Functions*/

    render(arrKeywordCloudData: KeywordCloudData[]): string {

        const renderType = this.options.type.toLowerCase();

        if(renderType === 'wordcloud'){
            return this.getWordCloudHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }
        if(renderType == 'table'){
            return this.getTableHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }
        if(renderType == 'chart'){
            return this.getChartHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }

        // const html = this.getHTMLFromArrKeywordCloudData(arrKeywordCloudData);

        return ''
    }

    getChartHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {
        const canvasId = `keyword-chart-${Math.random().toString(36).substr(2, 9)}`;
        const html = `<div class="synaptic-route-container chart" style="width: 100%; height: 0; padding-bottom: 50%;"><canvas id="${canvasId}"></canvas></div>`;
        let labels : string[] = []
        
        if(this.settings.keywordSelectionMethod === 'tags'){
            labels = arrKeywordCloudData.map(t => `#${t.displayName}`);
        }else{
            labels = arrKeywordCloudData.map(t => `#${t.displayName.slice(2)}`);
        }

        const vaultName = this.obsidianUtils.getVaultName();
        const links = arrKeywordCloudData.map(t => `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(t.displayName)}`);
        
        setTimeout(() => {
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

                // 현재 Obsidian의 테마를 확인하는 함수 (이 함수는 Obsidian API에 따라 다를 수 있습니다)
                const isCurrentThemeDark = () => document.body.classList.contains('theme-dark');

                // 기본 색상 설정
                Chart.defaults.color = isCurrentThemeDark() ? '#FFF' : '#000';

                // 옵션에 따라 색상 재설정
                if (this.options.theme === 'dark') {
                    Chart.defaults.color = '#FFF';
                } else if (this.options.theme === 'light') {
                    Chart.defaults.color = '#000';
                }

                const createOrUpdateChart = () => {
                    updateCanvasSize();

                    // 현재 테마에 따른 색상 결정
                    const currentColor = isCurrentThemeDark() ? '#E0E0E0' : '#333';
                    const gridDefaultColor = isCurrentThemeDark() ? '#555' : '#CCC';
                    // 옵션에 따른 색상 설정
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
                            } as any]  // 'as any'를 사용하여 타입 체크를 우회합니다.
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            devicePixelRatio: dpr,
                            plugins: {
                                legend: {
                                    display: false  // 범례를 숨깁니다
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

                // 디바운스 함수
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

                // 디바운스된 차트 업데이트 함수
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

                // 초기 차트 생성
                createOrUpdateChart();
            }
        }, 100);

        return html;
    }

    getTableHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {

        let tableRows = '';
        let countTitle = '';

        if(this.settings.keywordBacklinkType === 'allNotes'){
            countTitle = 'All Links';
        }else if(this.settings.keywordBacklinkType === 'permanentNotesOnly'){
            countTitle = 'Permanent Links';
        }
        if(this.settings.keywordSelectionMethod === 'tags'){
            tableRows = arrKeywordCloudData.map(item => `
                <tr>
                    <td>${item.rank}</td>
                    <td><a href="#${item.displayName}" class="tag" target="_blank" rel="noopener nofollow">#${item.displayName}</a></td>
                    <td>${item.score}</td>
                    <td>${item.backlinkCount}</td>
                </tr>
            `).join('');
        }else{
            tableRows = arrKeywordCloudData.map(item => `
                <tr>
                    <td>${item.rank}</td>
                    <td><span class="synaptic-route-table-link"><a data-tooltip-position="top" aria-label="${item.fileName}" data-href="${item.fileName}" href="${item.fileName}" class="internal-link" target="_blank" rel="noopener nofollow">${item.displayName}</a></span></td>
                    <td>${item.score}</td>
                    <td>${item.backlinkCount}</td>
                </tr>
            `).join('');
        }

        const tableHTML = `
            <table class="synaptic-route-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Keyword</th>
                        <th>Score</th>
                        <th>${countTitle}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        return tableHTML;
    }

    getWordCloudHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {
        // Shuffle the array to randomize the order of keywords
        const keywordType = this.settings.keywordSelectionMethod;
        const shuffledData = this.obsidianUtils.shuffledArray([...arrKeywordCloudData]);

        let keywordSpans = '';
        const displayType = this.options.type.toLowerCase();

        if(keywordType === 'tags'){
            keywordSpans = shuffledData.map(item => 
                `<span class="cloud ${item.cloudFactor}"><a href="#${item.displayName}" class="tag" target="_blank" rel="noopener nofollow">#${item.displayName}</a></span>`
            ).join('');
        }else{
            keywordSpans = shuffledData.map(item => 
                `<span class="cloud ${item.cloudFactor}"><a data-tooltip-position="top" aria-label="${item.fileName}" data-href="${item.fileName}" href="${item.fileName}" class="internal-link" target="_blank" rel="noopener nofollow">#${item.displayName.slice(2)}</a></span>`
            ).join('');
        }

        // Remove theme from here and only use displayType
        const html = `<div class="synaptic-route-container ${displayType}"><div class="synaptic-route-row"><div class="synaptic-route-keyword-cloud">${keywordSpans}</div></div></div>`;

        return html;
    }

    getArrObjMatchedKeywordFromArrPath(arrPath: string[]): MatchedKeyword[] {
        let result: MatchedKeyword[] = [];
        arrPath.forEach(path => {
            const objMatchedKeyword = this.getObjMatchedKeywordFromPath(path);
            result.push(objMatchedKeyword);
        });

        return result;
    }

    getObjMatchedKeywordFromPath(path: string): MatchedKeyword {

        const keywordsType = this.settings.keywordSelectionMethod;
        let keywords: string[] = [];

        if (keywordsType === 'tags') {
            keywords = this.obsidianUtils.getArrTagFromPath(path);
        }else{
            
            keywords = this.obsidianUtils.getArrPathOfOutlinkFromPath(path)
                .filter(p => this.isKeyword(p));
            switch(keywordsType){
                case 'fileNamePrefix':
                    keywords = keywords.filter(keyword => keyword.startsWith(this.settings.keywordSelectionInput));
                    break;
                case 'fileNameSuffix':
                    keywords = keywords.filter(keyword => keyword.endsWith(this.settings.keywordSelectionInput));
                    break;
                case 'fileNameRegex':
                    const regex = new RegExp(this.settings.keywordSelectionInput);
                    keywords = keywords.filter(keyword => regex.test(keyword));
                    break;
            }
        }

        return {
            path: path,
            keywordsType: keywordsType,
            keywords: keywords,
            hasKeywords: keywords.length > 0
        };
    }

    getArrPathOfLiteratureCardFromArrayPath(arrPath: string[]): string[] {
        const result: string[] = arrPath
            .filter(path => this.isLiteratureNote(path));
        return result;

    }

    isLiteratureNote(path: string): boolean {
        const queryType = this.settings.literatureNoteSelectionMethod;
        if(queryType === 'folderPath'){
            return path.includes(this.settings.literatureNoteSelectionInput);
        }
        return false;
    }

    getArrPathOfMainCardFromArrayPath(arrPath: string[]): string[] {
        const result: string[] = arrPath
            .filter(path => this.isMainCard(path));
        return result;
    }

    isMainCard(path: string): boolean {
        const queryType = this.settings.permanentNoteSelectionMethod;

        if(queryType === 'folderPath'){
            return path.includes(this.settings.permanentNoteSelectionInput);
        }
        return false;
    }

    isKeyword(path: string): boolean {
        const queryType = this.settings.keywordSelectionMethod;
        const queryInput = this.settings.keywordSelectionInput;

        if(queryType === 'tags'){
            return this.obsidianUtils.getArrTagFromPath(path).length > 0;
        }else if(queryType === 'fileNamePrefix'){
            return path.startsWith(queryInput);
        }else if(queryType === 'fileNameSuffix'){
            return path.endsWith(queryInput);
        }else if(queryType === 'fileNameRegex'){
            const regex = new RegExp(queryInput);
            return regex.test(path);
        }
        return false;
    }

    executeFilterOption(arrPath: string[]): string[] {
        const excludeFileNamePatterns = this.settings.excludeFileNamePatterns;
        const excludeTags = this.settings.excludeTags;
        const excludeFolders = this.settings.excludeFolders;
        let filteredArrPath = arrPath;

        if(excludeFileNamePatterns.length > 0){
            filteredArrPath = filteredArrPath.filter(path => {
                const fileName = this.obsidianUtils.getFileNameFromPath(path);
                return !excludeFileNamePatterns.some(pattern => this.matchPattern(fileName, pattern));
            });
        }

        if(excludeFolders.length > 0){
            filteredArrPath = filteredArrPath.filter(path => {
                const folderPath = this.obsidianUtils.getFolderPathFromPath(path);
                return !excludeFolders.some(pattern => this.matchPattern(folderPath, pattern));
            });
        }

        if(excludeTags.length > 0){
            filteredArrPath = filteredArrPath.filter(path => {
                const tags = this.obsidianUtils.getArrTagFromPath(path);
                return !tags.some(tag => excludeTags.includes(tag));
            });
        }
        return filteredArrPath;
    }

    // 패턴 매칭을 위한 헬퍼 메소드
    private matchPattern(text: string, pattern: string): boolean {
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
            // It's a regex pattern
            const regex = new RegExp(pattern.slice(1, -1));
            return regex.test(text);
        } else {
            // It's a simple string pattern
            return text.includes(pattern);
        }
    }

    getArrKeywordCloudWithoutCloudFactorFromArrNameOfKeyword(arrNameOfKeyword: string[]): KeywordCloudData[] {
        // 키워드 카운트
        const keywordCounts = arrNameOfKeyword.reduce((acc, keyword) => {
            acc[keyword] = (acc[keyword] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 카운트에 따라 정렬된 고유 키워드 배열
        const sortedKeywords = Object.keys(keywordCounts).sort((a, b) => keywordCounts[b] - keywordCounts[a]);

        // KeywordCloudData 배열 생성
        return sortedKeywords.map((keyword, index) => ({
            keywordType: this.settings.keywordSelectionMethod,
            displayName: keyword,
            fileName: this.obsidianUtils.getFileNameFromDisplayName(keyword),
            rank: index + 1,
            score: keywordCounts[keyword],
            backlinkCountType: this.settings.keywordBacklinkType,
            backlinkCount: this.getCountOfInlinkFromKeywordDisplayName(keyword),
            cloudFactor: 'cloud1'
        }));
    }

    getCountOfInlinkFromKeywordDisplayName(keywordName: string): number {
        const typeOfKeywordInlink = this.settings.keywordBacklinkType;
        
        const arrTFileOfAllFile = this.obsidianUtils.getAllTFileOfVault();
        const arrPathOfAllFile = arrTFileOfAllFile.map(t => t.path);
        let arrPathOfFilteredFile = this.executeFilterOption(arrPathOfAllFile);
        let inlinksCount = 0;

        if(typeOfKeywordInlink === 'permanentNotesOnly'){
            arrPathOfFilteredFile = arrPathOfFilteredFile
                .filter(path => this.isMainCard(path));
        }

        arrPathOfFilteredFile.forEach(path => {
            const keywords = this.getObjMatchedKeywordFromPath(path);
            if(keywords.hasKeywords){
                if(keywords.keywords.includes(keywordName)){
                    inlinksCount++;
                }
            }
        });



        return inlinksCount;
    }

    getArrKeywordCloudDataFromArrNameOfKeyword(keywordCloudDataWithoutCloudFactor: KeywordCloudData[]): KeywordCloudData[] {
        const scores = keywordCloudDataWithoutCloudFactor.map(item => item.score);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
    
        // 로그 스케일 적용 (1을 더해 0을 방지)
        const logMinScore = Math.log(minScore + 1);
        const logMaxScore = Math.log(maxScore + 1);
    
        // 값의 범위가 너무 작은 경우를 대비한 보정값
        const range = Math.max(logMaxScore - logMinScore, 1);
    
        return keywordCloudDataWithoutCloudFactor.map(item => {
            const logScore = Math.log(item.score + 1);
            
            // 로그 스케일에서의 상대적 위치 계산 (0-1 사이 값)
            const relativePosition = (logScore - logMinScore) / range;
            
            // cloudFactor 계산 (1부터 7까지)
            const cloudFactorNumber = Math.round(1 + relativePosition * 6);
            
            // cloudFactor를 문자열로 변환 (예: 'cloud1', 'cloud3' 등)
            const cloudFactor = `cloud${cloudFactorNumber}`;
            
            return {
                ...item,
                cloudFactor: cloudFactor
            };
        });
    }
}



