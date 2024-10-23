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
    private static readonly DEFAULT_OPTIONS: SynapticRouteOptions = {
        type: 'wordcloud',
        chartType: 'bar',
        global: false,
        maxItem: 30,
        maxRandomItem: 5,
        theme: 'default'
    };

    private static readonly VALID_KEYS = ['type', 'charttype', 'global', 'maxitem', 'maxrandomitem', 'theme'];

    static validate(options: Record<string, string>): SynapticRouteOptions {
        const validatedOptions = { ...this.DEFAULT_OPTIONS };
        const errors: SyntaxError[] = [];

        Object.entries(options).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (!this.VALID_KEYS.includes(lowerKey)) {
                errors.push(this.createError(key, value, `Invalid key. Valid keys are: ${this.VALID_KEYS.map(k => `'${k}'`).join(', ')}`));
                return;
            }

            try {
                switch (lowerKey) {
                    case 'type':
                        validatedOptions.type = this.validateType(value);
                        break;
                    case 'charttype':
                        if (validatedOptions.type === 'chart') {
                            validatedOptions.chartType = this.validateChartType(value);
                        }
                        break;
                    case 'global':
                        validatedOptions.global = this.validateGlobal(value);
                        break;
                    case 'maxitem':
                        validatedOptions.maxItem = this.validateNumber(value, 'MaxItem');
                        break;
                    case 'maxrandomitem':
                        validatedOptions.maxRandomItem = this.validateNumber(value, 'MaxRandomItem');
                        break;
                    case 'theme':
                        validatedOptions.theme = this.validateTheme(value);
                        break;
                }
            } catch (error) {
                errors.push(this.createError(key, value, error.message));
            }
        });

        if (errors.length > 0) {
            throw errors;
        }

        return validatedOptions;
    }

    private static createError(key: string, value: string, message: string): SyntaxError {
        return { key, value, message };
    }

    private static validateType(value: string): SynapticRouteType {
        return this.validateEnum<SynapticRouteType>(['wordcloud', 'chart', 'table'], value, 'Type');
    }

    private static validateChartType(value: string): keyof ChartTypeRegistry {
        return this.validateEnum<keyof ChartTypeRegistry>(['bar', 'line', 'pie', 'doughnut', 'polarArea'], value, 'ChartType');
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
        return this.validateEnum<Theme>(['dark', 'light'], value, 'Theme');
    }

    private static validateEnum<T extends string>(validValues: T[], value: string, name: string): T {
        const normalizedValue = value.toLowerCase();
        if (!validValues.some(v => v.toLowerCase() === normalizedValue)) {
            throw new Error(`Must be one of: ${validValues.map(v => `'${v}'`).join(', ')}`);
        }
        return validValues.find(v => v.toLowerCase() === normalizedValue) as T;
    }
}
