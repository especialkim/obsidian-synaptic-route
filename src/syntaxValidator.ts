import { SynapticRouteOptions, SynapticRouteType, ChartType, Theme, SyntaxError } from './types';
import { ChartTypeRegistry } from 'chart.js';

/* Syntax
    
```SynapticRoute
    Type: WordCloud|Chart|Table
    ChartType: Bar|Pie|Polar|Radar
    Global: true|false
    MaxItem: <숫자>
    MaxRandomItem: <숫자>
    Theme: Dark|Light
```

- 구문 설명
	- Type: 시각화 유형 (기본값: WordCloud)
	- ChartType: 'Chart' 선택 시 특정 차트 유형 (기본값: Bar)
	- Global: 모든 노트 포함 여부 또는 1단계 연결된 노트만 포함 (기본값: false)
	- MaxItem: 표시할 최대 항목 수 (기본값: 30)
	- MaxRandomItem: MaxItem 초과 시 포함할 최대 랜덤 항목 수 (기본값: 5)
	- Theme: 출력물의 시각적 테마 (기본값: Dark)
- 참고사항
	- 모든 매개변수는 선택사항입니다.
	- ChartType은 Type이 'Chart'로 설정된 경우에만 적용됩니다.
	- Global이 false이고 Lucy Zettelkasten 옵션이 활성화된 경우, 플러그인은 1단계 내에서 문헌 노트와 직접 연결된 영구 노트도 포함합니다.
*/


export class SyntaxValidator {
    static validate(options: Record<string, string>): SynapticRouteOptions {
        const validatedOptions: SynapticRouteOptions = {
            type: 'wordcloud',
            chartType: 'bar', // Add this line
            global: false,
            maxItem: 30,
            maxRandomItem: 5,
            theme: 'default'
        };

        const errors: SyntaxError[] = [];

        if (options['type']) {
            try {
                validatedOptions.type = this.validateType(options['type']);
            } catch (error) {
                errors.push({ key: 'Type', value: options['type'], message: error.message });
            }
        }

        if (validatedOptions.type === 'chart') {
            try {
                validatedOptions.chartType = this.validateChartType(options['charttype']);
            } catch (error) {
                errors.push({ key: 'ChartType', value: options['charttype'], message: error.message });
            }
        }

        if (options['global']) {
            try {
                validatedOptions.global = this.validateGlobal(options['global']);
            } catch (error) {
                errors.push({ key: 'Global', value: options['global'], message: error.message });
            }
        }

        if (options['maxitem']) {
            try {
                validatedOptions.maxItem = this.validateNumber(options['maxitem'], 'MaxItem');
            } catch (error) {
                errors.push({ key: 'MaxItem', value: options['maxitem'], message: error.message });
            }
        }

        if (options['maxrandomitem']) {
            try {
                validatedOptions.maxRandomItem = this.validateNumber(options['maxrandomitem'], 'MaxRandomItem');
            } catch (error) {
                errors.push({ key: 'MaxRandomItem', value: options['maxrandomitem'], message: error.message });
            }
        }

        if (options['theme']) {
            try {
                validatedOptions.theme = this.validateTheme(options['theme']);
            } catch (error) {
                errors.push({ key: 'Theme', value: options['theme'], message: error.message });
            }
        }

        const validKeys = ['type', 'charttype', 'global', 'maxitem', 'maxrandomitem', 'theme'];
        Object.keys(options).forEach(key => {
            if (!validKeys.includes(key.toLowerCase())) {
                errors.push({ 
                    key: key, 
                    value: options[key], 
                    message: `Invalid key. Valid keys are: ${validKeys.map(key => `'${key}'`).join(', ')}`
                });
            }
        });

        if (errors.length > 0) {
            throw errors;
        }

        return validatedOptions;
    }

    private static validateType(value: string): SynapticRouteType {
        const validTypes: SynapticRouteType[] = ['wordcloud', 'chart', 'table'];
        const normalizedValue = value.toLowerCase();
        if (!validTypes.some(type => type.toLowerCase() === normalizedValue)) {
            throw new Error(`Must be one of: ${validTypes.map(type => `'${type}'`).join(', ')}`);
        }
        return validTypes.find(type => type.toLowerCase() === normalizedValue) as SynapticRouteType;
    }

    private static validateChartType(value: string | undefined): keyof ChartTypeRegistry {
        const validChartTypes: (keyof ChartTypeRegistry)[] = ['bar', 'line', 'pie', 'doughnut', 'polarArea'];
        const normalizedValue = value ? value.toLowerCase() : 'bar';
        if (!validChartTypes.some(type => type.toLowerCase() === normalizedValue)) {
            throw new Error(`Must be one of: ${validChartTypes.join(', ')}`);
        }
        return validChartTypes.find(type => type.toLowerCase() === normalizedValue) as keyof ChartTypeRegistry;
    }

    private static validateGlobal(value: string): boolean {
        if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
            throw new Error(`Must be 'true' or 'false'`);
        }
        return value.toLowerCase() === 'true';
    }

    private static validateNumber(value: string, name: string): number {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
            throw new Error(`Must be a positive integer`);
        }
        return num;
    }

    private static validateTheme(value: string): Theme {
        const validThemes: Theme[] = ['dark', 'light'];
        const normalizedValue = value.toLowerCase();
        if (!validThemes.some(theme => theme.toLowerCase() === normalizedValue)) {
            throw new Error(`Must be one of: ${validThemes.map(theme => `'${theme}'`).join(', ')}`);
        }
        return validThemes.find(theme => theme.toLowerCase() === normalizedValue) as Theme;
    }
}
