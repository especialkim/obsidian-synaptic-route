import { Plugin } from 'obsidian';
import { CodeblockRouter } from './src/codeblockRouter';
import { ObsidianUtils } from './src/obsidianUtils';
import { SynapticRouteSettings, DEFAULT_SETTINGS, SynapticRouteSettingTab } from './src/settings';

export default class SynapticRoute extends Plugin {
	settings: SynapticRouteSettings;
	private codeblockRouter: CodeblockRouter;

	async onload(): Promise<void> {
		await this.loadSettings();

		ObsidianUtils.initialize(this.app);
		this.codeblockRouter = new CodeblockRouter(this.settings);

		this.registerMarkdownCodeBlockProcessor("SynapticRoute", (source, el, ctx) => {
			this.codeblockRouter.processCodeblock("SynapticRoute", source, el, ctx);
		});

		this.addCommand({
			id: 'print-synaptic-route-settings',
			name: 'Print Settings',
			callback: () => {
				console.log('Current Synaptic Route Settings:', this.settings);
			}
		});

		this.addSettingTab(new SynapticRouteSettingTab(this.app, this));
	}

	onunload(): void {
		// Add cleanup tasks here if needed
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

// 필요한 경우 SettingTab 클래스를 구현하세요
