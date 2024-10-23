import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from '../main';

export interface SynapticRouteSettings {
    keywordSelectionMethod: 'tags' | 'fileNamePrefix' | 'fileNameSuffix' | 'fileNameRegex' ;
    keywordSelectionInput: string;
    keywordBacklinkType: 'allNotes' | 'permanentNotesOnly';
    permanentNoteSelectionMethod: 'tags' | 'fileNamePrefix' | 'fileNameSuffix' | 'fileNameRegex' | 'folderPath';
    permanentNoteSelectionInput: string;
    lucyZettelkastenEnabled: boolean;
    literatureNoteSelectionMethod: 'tags' | 'fileNamePrefix' | 'fileNameSuffix' | 'fileNameRegex' | 'folderPath';
    literatureNoteSelectionInput: string;
    excludeFolders: string[];
    excludeTags: string[];
    excludeFileNamePatterns: string[];
}

export const DEFAULT_SETTINGS: SynapticRouteSettings = {
    keywordSelectionMethod: 'tags',
    keywordSelectionInput: '',
    keywordBacklinkType: 'permanentNotesOnly',
    permanentNoteSelectionMethod: 'folderPath',
    permanentNoteSelectionInput: '',
    lucyZettelkastenEnabled: false,
    literatureNoteSelectionMethod: 'folderPath',
    literatureNoteSelectionInput: '',
    excludeFolders: [],
    excludeTags: [],
    excludeFileNamePatterns: [],
}

export class SynapticRouteSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h1', {text: '관련 키워드 시각화'});
        containerEl.createEl('h2', {text: '키워드 선별 방식'});

        // Keyword Selection Method
        new Setting(containerEl)
            .setName('키워드 선별 방식')
            .setDesc('노트 내에서 키워드를 식별하는 방법을 정의합니다.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'tags': '태그',
                    'fileNamePrefix': '파일명 접두사',
                    'fileNameSuffix': '파일명 접미사',
                    'fileNameRegex': '파일명 정규 표현식'
                })
                .setValue(this.plugin.settings.keywordSelectionMethod)
                .onChange(async (value) => {
                    this.plugin.settings.keywordSelectionMethod = value as SynapticRouteSettings['keywordSelectionMethod'];
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Keyword Selection Input (conditional)
        new Setting(containerEl)
            .setName('키워드 선별 입력')
            .setDesc('선택한 방식에 따른 키워드 선별 기준을 입력하세요.')
            .addText(text => text
                .setPlaceholder('예: #keyword 또는 ^KW-')
                .setValue(this.plugin.settings.keywordSelectionInput)
                .onChange(async (value) => {
                    this.plugin.settings.keywordSelectionInput = value;
                    await this.plugin.saveSettings();
            }));

        // Keyword Backlink Type
        new Setting(containerEl)
            .setName('키워드 백링크 유형')
            .setDesc('키워드 백링크로 고려할 노트 유형을 지정합니다.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'allNotes': '모든 노트',
                    'permanentNotesOnly': '영구 노트만'
                })
                .setValue(this.plugin.settings.keywordBacklinkType)
                .onChange(async (value) => {
                    this.plugin.settings.keywordBacklinkType = value as SynapticRouteSettings['keywordBacklinkType'];
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Permanent Note Selection Method (conditional)
        if (this.plugin.settings.keywordBacklinkType === 'permanentNotesOnly') {
            new Setting(containerEl)
                .setName('영구 노트 선별 방식')
                .setDesc('영구 노트를 식별하는 방법을 정의합니다.')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'tags': '태그',
                        'fileNamePrefix': '파일명 접두사',
                        'fileNameSuffix': '파일명 접미사',
                        'regex': '파일명 정규 표현식',
                        'folderPath': '폴더 경로'
                    })
                    .setValue(this.plugin.settings.permanentNoteSelectionMethod)
                    .onChange(async (value) => {
                        this.plugin.settings.permanentNoteSelectionMethod = value as SynapticRouteSettings['permanentNoteSelectionMethod'];
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName('영구 노트 선별 입력')
                .setDesc('선택한 방식에 따른 영구 노트 선별 기준을 입력하세요.')
                .addText(text => text
                    .setPlaceholder('예: #permanent 또는 Permanent/')
                    .setValue(this.plugin.settings.permanentNoteSelectionInput)
                    .onChange(async (value) => {
                        this.plugin.settings.permanentNoteSelectionInput = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Lucy Zettelkasten 옵션
        containerEl.createEl('h2', {text: 'Lucy Zettelkasten 옵션'});

        new Setting(containerEl)
            .setName('Lucy Zettelkasten 활성화')
            .setDesc('Lucy Zettelkasten 워크플로우를 따르는 사용자를 위한 특별 옵션입니다.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.lucyZettelkastenEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.lucyZettelkastenEnabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.lucyZettelkastenEnabled) {
            new Setting(containerEl)
                .setName('문헌 노트 선별 방식')
                .setDesc('문헌 노트를 식별하는 방법을 정의합니다.')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'tags': '태그',
                        'fileNamePrefix': '파일명 접두사',
                        'fileNameSuffix': '파일명 접미사',
                        'regex': '파일명 정규 표현식',
                        'folderPath': '폴더 경로'
                    })
                    .setValue(this.plugin.settings.literatureNoteSelectionMethod)
                    .onChange(async (value) => {
                        this.plugin.settings.literatureNoteSelectionMethod = value as SynapticRouteSettings['literatureNoteSelectionMethod'];
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName('문헌 노트 선별 입력')
                .setDesc('선택한 방식에 따른 문헌 노트 선별 기준을 입력하세요.')
                .addText(text => text
                    .setPlaceholder('예: Literature/ 또는 #literature')
                    .setValue(this.plugin.settings.literatureNoteSelectionInput)
                    .onChange(async (value) => {
                        this.plugin.settings.literatureNoteSelectionInput = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // 필터링 옵션
        containerEl.createEl('h2', {text: '필터링 옵션'});

        new Setting(containerEl)
            .setName('제외할 폴더')
            .setDesc('제외할 폴더 경로를 한 줄에 하나씩 입력합니다. 정규 표현식 지원.')
            .addTextArea(text => text
                .setPlaceholder('예:\nDaily/\n^Archive/')
                .setValue(this.plugin.settings.excludeFolders.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeFolders = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('제외할 태그')
            .setDesc('제외할 태그를 한 줄에 하나씩 입력합니다. 정규 표현식 지원.')
            .addTextArea(text => text
                .setPlaceholder('예:\n#private\n#temp.*')
                .setValue(this.plugin.settings.excludeTags.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeTags = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('파일명 파일')
            .setDesc('제외할 파일명 패턴을 한 줄에 하나씩 입력합니다. 정규 표현식 지원.')
            .addTextArea(text => text
                .setPlaceholder('예:\n^_.*\n.*\.tmp$')
                .setValue(this.plugin.settings.excludeFileNamePatterns.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeFileNamePatterns = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        // ... 추가 설정들 ...
    }
}
