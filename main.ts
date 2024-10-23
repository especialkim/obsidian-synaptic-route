import { MarkdownView, Plugin } from 'obsidian';
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

		// For debugging
		// this.addCommand({
		// 	id: 'print-synaptic-route-settings',
		// 	name: 'Print Settings',
		// 	callback: () => {
		// 		console.log('Current Synaptic Route Settings:', this.settings);
		// 	}
		// });

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
		// 설정이 저장될 때마다 모든 마크다운 뷰를 리프레시
		this.refreshAllMarkdownViews();
	}

	private refreshAllMarkdownViews(): void {
		// 현재 열려있는 모든 마크다운 뷰를 새로고침
		this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
			if (leaf.view instanceof MarkdownView) {
				leaf.view.previewMode.rerender(true);
			}
		});
	}
}

// 필요한 경우 SettingTab 클래스를 구현하세요
