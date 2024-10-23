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
        containerEl.createEl('h1', {text: 'Keyword Visualization'});
        containerEl.createEl('h2', {text: 'Keyword Selection Method'});

        // Keyword Selection Method
        new Setting(containerEl)
            .setName('Keyword Selection Method')
            .setDesc('Define how to identify keywords in notes.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'tags': 'Tags',
                    'fileNamePrefix': 'Filename Prefix',
                    'fileNameSuffix': 'Filename Suffix',
                    'fileNameRegex': 'Filename Regex'
                })
                .setValue(this.plugin.settings.keywordSelectionMethod)
                .onChange(async (value) => {
                    this.plugin.settings.keywordSelectionMethod = value as SynapticRouteSettings['keywordSelectionMethod'];
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Keyword Selection Input
        new Setting(containerEl)
            .setName('Keyword Selection Input')
            .setDesc('Enter the criteria for keyword selection based on the selected method.')
            .addText(text => text
                .setPlaceholder('e.g., #keyword or ^KW-')
                .setValue(this.plugin.settings.keywordSelectionInput)
                .onChange(async (value) => {
                    this.plugin.settings.keywordSelectionInput = value;
                    await this.plugin.saveSettings();
                }));

        // Keyword Backlink Type
        new Setting(containerEl)
            .setName('Keyword Backlink Type')
            .setDesc('Specify which type of notes to consider for keyword backlinks.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'allNotes': 'All Notes',
                    'permanentNotesOnly': 'Permanent Notes Only'
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
                .setName('Permanent Note Selection Method')
                .setDesc('Define how to identify permanent notes.')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'tags': 'Tags',
                        'fileNamePrefix': 'Filename Prefix',
                        'fileNameSuffix': 'Filename Suffix',
                        'regex': 'Filename Regex',
                        'folderPath': 'Folder Path'
                    })
                    .setValue(this.plugin.settings.permanentNoteSelectionMethod)
                    .onChange(async (value) => {
                        this.plugin.settings.permanentNoteSelectionMethod = value as SynapticRouteSettings['permanentNoteSelectionMethod'];
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName('Permanent Note Selection Input')
                .setDesc('Enter the criteria for permanent note selection based on the selected method.')
                .addText(text => text
                    .setPlaceholder('e.g., #permanent or Permanent/')
                    .setValue(this.plugin.settings.permanentNoteSelectionInput)
                    .onChange(async (value) => {
                        this.plugin.settings.permanentNoteSelectionInput = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Lucy Zettelkasten Options
        containerEl.createEl('h2', {text: 'Lucy Zettelkasten Options'});

        new Setting(containerEl)
            .setName('Enable Lucy Zettelkasten')
            .setDesc('Special options for users following the Lucy Zettelkasten workflow.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.lucyZettelkastenEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.lucyZettelkastenEnabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.lucyZettelkastenEnabled) {
            new Setting(containerEl)
                .setName('Literature Note Selection Method')
                .setDesc('Define how to identify literature notes.')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        'tags': 'Tags',
                        'fileNamePrefix': 'Filename Prefix',
                        'fileNameSuffix': 'Filename Suffix',
                        'regex': 'Filename Regex',
                        'folderPath': 'Folder Path'
                    })
                    .setValue(this.plugin.settings.literatureNoteSelectionMethod)
                    .onChange(async (value) => {
                        this.plugin.settings.literatureNoteSelectionMethod = value as SynapticRouteSettings['literatureNoteSelectionMethod'];
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            new Setting(containerEl)
                .setName('Literature Note Selection Input')
                .setDesc('Enter the criteria for literature note selection based on the selected method.')
                .addText(text => text
                    .setPlaceholder('e.g., Literature/ or #literature')
                    .setValue(this.plugin.settings.literatureNoteSelectionInput)
                    .onChange(async (value) => {
                        this.plugin.settings.literatureNoteSelectionInput = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Filtering Options
        containerEl.createEl('h2', {text: 'Filtering Options'});

        new Setting(containerEl)
            .setName('Exclude Folders')
            .setDesc('Enter folder paths to exclude, one per line. Supports regex.')
            .addTextArea(text => text
                .setPlaceholder('e.g.:\nDaily/\n^Archive/')
                .setValue(this.plugin.settings.excludeFolders.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeFolders = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Exclude Tags')
            .setDesc('Enter tags to exclude, one per line. Supports regex.')
            .addTextArea(text => text
                .setPlaceholder('e.g.:\n#private\n#temp.*')
                .setValue(this.plugin.settings.excludeTags.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeTags = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Exclude Filename Patterns')
            .setDesc('Enter filename patterns to exclude, one per line. Supports regex.')
            .addTextArea(text => text
                .setPlaceholder('e.g.:\n^_.*\n.*\.tmp$')
                .setValue(this.plugin.settings.excludeFileNamePatterns.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.excludeFileNamePatterns = value.split('\n').filter(item => item.trim() !== '');
                    await this.plugin.saveSettings();
                }));

        // ... 추가 설정들 ...
    }
}
