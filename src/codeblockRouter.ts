import { MarkdownPostProcessorContext } from 'obsidian';
import { SyntaxValidator } from './syntaxValidator';
import { SyntaxError } from './types';
import { KeywordCloud } from './keywordCloud';
import { SynapticRouteSettings } from './settings';


export class CodeblockRouter {
    private processors: Record<string, (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void> = {};

    constructor(private settings: SynapticRouteSettings) {
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
        const rawOptions = this.parseOptions(source);

        try {
            const options = SyntaxValidator.validate(rawOptions);
            new KeywordCloud(el, ctx, this.settings, options).process();
        } catch (errors) {
            this.displayErrors(el, errors as SyntaxError[]);
        }
    }

    private parseOptions(source: string): Record<string, string> {
        return source.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .reduce((acc, line) => {
                const [key, value] = line.split(':').map(part => part.trim());
                if (key && value) {
                    acc[key.toLowerCase()] = value;
                }
                return acc;
            }, {} as Record<string, string>);
    }

    private displayErrors(el: HTMLElement, errors: SyntaxError[]) {
        const errorDiv = el.createEl('div');
        errorDiv.createEl('h5', { text: 'Syntax Errors:', attr: { class: 'error-header' } });

        errors.forEach(error => {
            const errorLine = errorDiv.createEl('div');
            errorLine.createEl('div', {
                text: `Wrong Input -> "${error.key}: ${error.value}"`,
                attr: { style: 'text-decoration: underline; font-style: italic;' }
            });
            errorLine.createEl('div', {
                text: `"${error.key}" ${error.message}`,
                attr: { style: 'font-style: italic;' }
            });
        });

        errorDiv.createEl('div', { text: '\nPlease correct these errors and try again.' });
    }
}
