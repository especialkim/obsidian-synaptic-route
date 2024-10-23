import { KeywordCloudData } from './types';
import { SynapticRouteSettings } from './settings';

export class KeywordTable {
    constructor(private settings: SynapticRouteSettings) {}

    getTableHTMLFromArrKeywordCloudData(arrKeywordCloudData: KeywordCloudData[]): string {
        const countTitle = this.settings.keywordBacklinkType === 'allNotes' ? 'All Links' : 'Permanent Links';
        const isTagSelection = this.settings.keywordSelectionMethod === 'tags';

        const tableRows = arrKeywordCloudData.map(item => `
            <tr>
                <td>${item.rank}</td>
                <td>${this.renderKeywordCell(item, isTagSelection)}</td>
                <td>${item.score}</td>
                <td>${item.backlinkCount}</td>
            </tr>
        `).join('');

        return `
            <table class="synaptic-route-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Keyword</th>
                        <th>Score</th>
                        <th>${countTitle}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    private renderKeywordCell(item: KeywordCloudData, isTagSelection: boolean): string {
        return isTagSelection
            ? `<a href="#${item.displayName}" class="tag" target="_blank" rel="noopener nofollow">#${item.displayName}</a>`
            : `<span class="synaptic-route-table-link"><a data-tooltip-position="top" aria-label="${item.fileName}" data-href="${item.fileName}" href="${item.fileName}" class="internal-link" target="_blank" rel="noopener nofollow">${item.displayName}</a></span>`;
    }
}
