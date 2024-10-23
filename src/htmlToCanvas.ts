import html2canvas from 'html2canvas';
import { Notice } from 'obsidian';

export class HtmlToCanvas {
    static async captureElementToClipboard(element: HTMLElement): Promise<void> {
        try {
            const backgroundColor = '#00000077'; // 다크 모드와 라이트 모드의 배경색 설정
            const canvas = await html2canvas(element, {
                backgroundColor: backgroundColor,
                useCORS: true,
                scale: 2, // 해상도를 높이기 위해 스케일 조정
            });
            
            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        new Notice('Screenshot copied to clipboard');
                    } catch (error) {
                        console.error('Error copying to clipboard:', error);
                        new Notice('Failed to copy screenshot to clipboard');
                    }
                } else {
                    throw new Error('Failed to create blob from canvas');
                }
            }, 'image/png');
        } catch (error) {
            console.error('Error capturing element:', error);
            new Notice('Failed to capture screenshot');
        }
    }
}
