import { MarkdownPostProcessorContext } from 'obsidian';
import { SynapticRouteOptions, KeywordCloudData } from './types';
import { ObsidianUtils } from './obsidianUtils';
import { SynapticRouteSettings} from './settings';
import { HtmlToCanvas } from './htmlToCanvas';
import { KeywordChart } from './keywordChart';
import { KeywordTable } from './keywordTable';

interface MatchedKeyword {
    path: string;
    keywordsType: string;
    keywords: string[];
    hasKeywords: boolean;
}

export class KeywordCloud {
    private settings: SynapticRouteSettings;
    private el: HTMLElement;
    private ctx: MarkdownPostProcessorContext;
    private obsidianUtils: ObsidianUtils;
    private options: SynapticRouteOptions;
    private buttonContainer: HTMLElement;
    private keywordChart: KeywordChart;
    private keywordTable: KeywordTable;

    constructor(el: HTMLElement, ctx: MarkdownPostProcessorContext, settings: SynapticRouteSettings, options: SynapticRouteOptions) {
        this.settings = settings;
        this.el = el;
        this.ctx = ctx;
        this.obsidianUtils = ObsidianUtils.getInstance();
        this.options = options;
        this.keywordChart = new KeywordChart(settings, options);
        this.keywordTable = new KeywordTable(settings);
    }

    /* Main Functions*/

    process() {
        try {
            this.el.empty();
 
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

            this.addButtons();

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

    private addButtons() {
        this.addButtonContainer();
        this.addRefreshButton();
        this.addCaptureButton();
        // 여기에 새로운 버튼을 추가할 수 있습니다.
    }

    private addButtonContainer() {
        this.buttonContainer = this.el.createEl('div', {
            cls: 'synaptic-route-button-container',
        });
        this.el.appendChild(this.buttonContainer);
    }

    private addRefreshButton() {
        const refreshButton = this.buttonContainer.createEl('button', {
            text: '🔄',
            cls: 'synaptic-route-button synaptic-route-button-refresh',
        });
        refreshButton.addEventListener('click', () => {
            this.process();
        });
    }

    private addCaptureButton() {
        const captureButton = this.buttonContainer.createEl('button', {
            text: '📷',
            cls: 'synaptic-route-button synaptic-route-button-capture',
        });
        captureButton.addEventListener('click', () => {
            const containerElement = this.el.querySelector('.synaptic-route-container');
            if (containerElement instanceof HTMLElement) {
                HtmlToCanvas.captureElementToClipboard(containerElement);
            } else {
                console.error('Container element not found');
                this.obsidianUtils.notice('Failed to capture: Container element not found');
            }
        });
    }

    render(arrKeywordCloudData: KeywordCloudData[]): string {

        const renderType = this.options.type.toLowerCase();

        if(renderType === 'wordcloud'){
            return this.getWordCloudHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }
        if(renderType == 'table'){
            return this.keywordTable.getTableHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }
        if(renderType == 'chart'){
            return this.keywordChart.getChartHTMLFromArrKeywordCloudData(arrKeywordCloudData);
        }

        // const html = this.getHTMLFromArrKeywordCloudData(arrKeywordCloudData);

        return ''
    }

    getWordCloudHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {
        // Shuffle the array to randomize the order of keywords
        const keywordType = this.settings.keywordSelectionMethod;
        const shuffledData = this.obsidianUtils.shuffledArray([...arrKeywordCloudData]);

        let keywordSpans = '';
        const displayType = this.options.type.toLowerCase();

        if(keywordType === 'tags'){
            keywordSpans = shuffledData.map(item => {
                const innerContent = this.getInnerContentFromKeywordDisplayName(item.displayName);
                return `<span class="cloud ${item.cloudFactor}"><a href="#${item.displayName}" class="tag" target="_blank" rel="noopener nofollow">#${item.displayName}</a></span>`
            }).join('');
        }else{
            keywordSpans = shuffledData.map(item => {
                const innerContent = this.getInnerContentFromKeywordDisplayName(item.displayName);
                return `<span class="cloud ${item.cloudFactor}"><a data-tooltip-position="top" aria-label="${item.fileName}" data-href="${item.fileName}" href="${item.fileName}" class="internal-link" target="_blank" rel="noopener nofollow">#${innerContent}</a></span>`
            }).join('');
        }

        // Remove theme from here and only use displayType
        const html = `<div class="synaptic-route-container ${displayType}"><div class="synaptic-route-row"><div class="synaptic-route-keyword-cloud">${keywordSpans}</div></div></div>`;

        return html;
    }

    private getInnerContentFromKeywordDisplayName(keywordDisplayName: string): string {
        const keywordType = this.settings.keywordSelectionMethod;
        let innerContent = ' ';
        if(keywordType === 'tags'){
            innerContent = keywordDisplayName.slice(1);
        }else if(keywordType === 'fileNamePrefix'){
            const prefix = this.settings.keywordSelectionInput;
            innerContent = keywordDisplayName.slice(prefix.length);
        }else if(keywordType === 'fileNameSuffix'){
            const suffix = this.settings.keywordSelectionInput;
            innerContent = keywordDisplayName.slice(0, -suffix.length);
        }else if(keywordType === 'fileNameRegex'){
            innerContent = keywordDisplayName;
        }
        return innerContent;
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
        if(queryType === 'tags'){
            const tags = this.obsidianUtils.getArrTagFromPath(path);
            const tag = this.settings.literatureNoteSelectionInput;
            return tags.includes(tag);
        }else if(queryType === 'fileNamePrefix'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            return fileName.startsWith(this.settings.literatureNoteSelectionInput);
        }else if(queryType === 'fileNameSuffix'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            const input = this.settings.literatureNoteSelectionInput;
            console.log(fileName.endsWith(input) || fileName.replace('.md', '').endsWith(input));
            return fileName.endsWith(input) || fileName.replace('.md', '').endsWith(input);
        }else if(queryType === 'fileNameRegex'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            const regex = new RegExp(this.settings.literatureNoteSelectionInput);
            return regex.test(fileName);
        }else if(queryType === 'folderPath'){
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

        if(queryType === 'tags'){
            const tags = this.obsidianUtils.getArrTagFromPath(path);
            const tag = this.settings.permanentNoteSelectionInput;
            return tags.includes(tag);
        }else if(queryType === 'fileNamePrefix'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            return fileName.startsWith(this.settings.permanentNoteSelectionInput);
        }else if(queryType === 'fileNameSuffix'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            const input = this.settings.permanentNoteSelectionInput;
            console.log(fileName.endsWith(input) || fileName.replace('.md', '').endsWith(input));
            return fileName.endsWith(input) || fileName.replace('.md', '').endsWith(input);
        }else if(queryType === 'fileNameRegex'){
            const fileName = this.obsidianUtils.getFileNameFromPath(path);
            const regex = new RegExp(this.settings.permanentNoteSelectionInput);
            return regex.test(fileName);
        }else if(queryType === 'folderPath'){
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