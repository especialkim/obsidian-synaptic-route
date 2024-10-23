import { Plugin } from 'obsidian';
import { CodeblockRouter } from './src/codeblockRouter';
import { ObsidianUtils } from './src/obsidianUtils';
import { SynapticRouteSettings, DEFAULT_SETTINGS, SynapticRouteSettingTab } from './src/settings';

export default class SynapticRoute extends Plugin {
	settings: SynapticRouteSettings;
	private codeblockRouter: CodeblockRouter;

	async onload() {
		await this.loadSettings();

		ObsidianUtils.initialize(this.app);
		this.codeblockRouter = new CodeblockRouter(this.settings);

		this.registerMarkdownCodeBlockProcessor("SynapticRoute", (source, el, ctx) => {
			this.codeblockRouter.processCodeblock("SynapticRoute", source, el, ctx);
		});

		// Add the new command
		this.addCommand({
			id: 'print-synaptic-route-settings',
			name: 'Print Settings',
			callback: () => {
				console.log('Current Synaptic Route Settings:', this.settings);
			}
		});

		// 설정 탭 추가
		this.addSettingTab(new SynapticRouteSettingTab(this.app, this));
	}

	onunload() {
		// 정리 작업이 필요한 경우 여기에 추가하세요
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// 필요한 경우 SettingTab 클래스를 구현하세요
