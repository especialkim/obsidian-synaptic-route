import { MarkdownPostProcessorContext } from 'obsidian';
import { SyntaxValidator } from './syntaxValidator';
import { SynapticRouteOptions, SyntaxError } from './types';
import { KeywordCloud } from './keywordCloud';
import { SynapticRouteSettings } from './settings';


export class CodeblockRouter {
    settings: SynapticRouteSettings;
    private processors: { [key: string]: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void } = {};

    constructor(settings: SynapticRouteSettings) {
        // 기본 프로세서 등록
        this.settings = settings;
        this.registerProcessor('SynapticRoute', this.synapticRouteProcessor.bind(this));
    }

    registerProcessor(name: string, processor: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void) {
        this.processors[name] = processor;
    }

    processCodeblock(name: string, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        if (this.processors[name]) {
            this.processors[name](source, el, ctx);
        } else {
            el.createEl('div', { text: `No processor found for ${name}` });
        }
    }

    private synapticRouteProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const lines = source.split('\n').map(line => line.trim()).filter(line => line);
        const rawOptions: Record<string, string> = {};

        lines.forEach(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) {
                rawOptions[key.toLowerCase()] = value;
            }
        });

        let options: SynapticRouteOptions;

        try {
            options = SyntaxValidator.validate(rawOptions);
        } catch (errors) {
            console.error("Syntax validation errors:", errors);
            
            const errorDiv = el.createEl('div');

            errorDiv.createEl('h5', { 
                text: 'Syntax Errors:',
                attr: { class: 'error-header' } 
            });

            (errors as SyntaxError[]).forEach(error => {
                const errorLine = errorDiv.createEl('div');
                const errorInputDiv = errorLine.createEl('div');
                errorInputDiv.createEl('span', { 
                    text: `Wrong Input -> `
                });
                errorInputDiv.createEl('span', { 
                    text: `"${error.key}: ${error.value}"`, 
                    attr: { style: 'text-decoration: underline; font-style: italic;' } 
                });

                const errorMessageDiv = errorLine.createEl('div');
                errorMessageDiv.createEl('span', { 
                    text: `"${error.key}"`, 
                    attr: { style: 'text-decoration: underline; font-style: italic;' } 
                });
                errorMessageDiv.createEl('span', { 
                    text: ` ${error.message}`
                });
            });

            errorDiv.createEl('div', { 
                text: '\nPlease correct these errors and try again.'
            });

            return; // 구문 오류가 있으면 여기서 함수 실행을 종료합니다.
        }

        new KeywordCloud(el, ctx, this.settings, options).process();
    }
}
