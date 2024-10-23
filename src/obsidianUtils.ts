import { App, TFile, CachedMetadata, Notice } from 'obsidian';

// 파일 상단에 새로운 인터페이스 추가
interface CommonLink {
    link: string;
    original: string;
    displayText: string;
    isExist: boolean;
    extension: string;
    path: string;
}

export class ObsidianUtils {
    private static instance: ObsidianUtils;
    private app: App;

    private constructor(app: App) {
        this.app = app;
    }

    static initialize(app: App): void {
        if (!ObsidianUtils.instance) {
            ObsidianUtils.instance = new ObsidianUtils(app);
        }
    }

    static getInstance(): ObsidianUtils {
        if (!ObsidianUtils.instance) {
            throw new Error('ObsidianUtils not initialized. Call initialize() first.');
        }
        return ObsidianUtils.instance;
    }

    async getFileContent(file: TFile): Promise<string> {
        return await this.app.vault.read(file);
    }

    async getFrontmatter(file: TFile): Promise<any> {
        const content = await this.getFileContent(file);
        const cache = this.app.metadataCache.getFileCache(file);
        return cache?.frontmatter || {};
    }

    getTFileFromPath(path: string): TFile | null {
        const tFile = this.app.vault.getAbstractFileByPath(path);
        return tFile instanceof TFile ? tFile : null;
    }

    getCachedMetadataFromPath(path: string): CachedMetadata | null {
        return this.app.metadataCache.getCache(path);
    }

    getFrontmatterFromPath(path: string): any | null {
        const cachedMetadata = this.getCachedMetadataFromPath(path);
        return cachedMetadata?.frontmatter || null;
    }

    getMetadataCacheFromTFile(file: TFile): CachedMetadata | null {
        return this.app.metadataCache.getFileCache(file);
    }

    getArrMetadataCacheOfBacklinkFromTFile(file: TFile): CachedMetadata[] {
        const backlinkedMetadata: CachedMetadata[] = [];
        const allBacklinks = this.app.metadataCache.getBacklinksForFile(file);

        for (const sourcePath of allBacklinks.keys()) {
            const metadataCache = this.app.metadataCache.getCache(sourcePath);
            if (metadataCache) {
                backlinkedMetadata.push(metadataCache);
            }
        }

        return backlinkedMetadata;
    }

    isExistLink(linkName: string): boolean {
        const allFiles = this.app.vault.getFiles();
        const isExist = allFiles.some(file => file.basename === linkName || file.name === linkName);
        return isExist;
    }

    async createLink(linkName: string): Promise<TFile> {
        return await this.app.vault.create(linkName, '');
    }

    getArrTFileOfBacklinkFromTFile(file: TFile): TFile[] {
        const backlinkedFiles: TFile[] = [];
        const allBacklinks = this.app.metadataCache.getBacklinksForFile(file);

        for (const sourcePath of allBacklinks.keys()) {
            const sourceFile = this.getTFileFromPath(sourcePath);
            if (sourceFile) {
                backlinkedFiles.push(sourceFile);
            }
        }

        return backlinkedFiles;
    }

    getArrPathOfBacklinkFromPath(path: string): string[] {
        const tFile = this.getTFileFromPath(path);
        if (!tFile) {
            return [];
        }
        const backlinks = this.app.metadataCache.getBacklinksForFile(tFile);
        return Array.from(backlinks.keys());
    }

    getArrLinkOfBacklinkFromPath(path: string): CommonLink[] {
        const tFile = this.getTFileFromPath(path);
        if (!tFile) {
            return [];
        }
        const backlinks = this.app.metadataCache.getBacklinksForFile(tFile);
        const arrLink: CommonLink[] = [];

        if (backlinks && backlinks.data instanceof Map) {
            backlinks.data.forEach((value, key) => {
                const fileName = this.getFileNameFromPath(key);
                const baseName = this.getBaseNameFromPath(key);
                const displayText = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
                arrLink.push({
                    link: baseName,
                    original: `[[${baseName}]]`,
                    displayText: displayText,
                    isExist: this.isExistLink(displayText),
                    extension: this.getExtensionFromDisplayName(displayText),
                    path: key
                });
            });
        }

        return arrLink;
    }

    getExtensionFromDisplayName(displayName: string): string {
        const tFile = this.getTFileFromLinkDisplayName(displayName);
        return tFile ? tFile.extension : '';
    }

    getArrDisplayNameOfBacklinkFromPath(path: string): string[] {
        const arrPathOfBacklink = this.getArrPathOfBacklinkFromPath(path);
        const arrDisplayNameOfBacklink = arrPathOfBacklink.map(path => this.getPathFromDisplayName(path));
        return arrDisplayNameOfBacklink;
    }

    getArrPathOfOutlinkFromPath(path: string): string[] {
        const arrLinkName = this.getArrDisplayNameOfOutlinkFromPath(path);
        const arrLink = arrLinkName.map(name => this.getPathFromDisplayName(name));
        return arrLink;
    }

    getArrDisplayNameOfOutlinkFromPath(path: string): string[] {
        const arrLink = this.getArrLinkOfOutlinkFromPath(path);
        return arrLink.map(l => l.link);
    }

    getArrLinkOfOutlinkFromPath(path: string): CommonLink[] {
        const cachedMetadata = this.getCachedMetadataFromPath(path);
        if(!cachedMetadata) return [];
        const frontmatterOutlinks = cachedMetadata.frontmatterLinks ?? [];
        const outlinks = cachedMetadata.links ?? [];
        const arrLink = [...frontmatterOutlinks, ...outlinks].map(link => ({
            link: link.link,
            original: link.original,
            displayText: link.displayText,
            isExist: this.isExistLink(link.displayText ?? ''),
            extension: this.getExtensionFromDisplayName(link.displayText ?? ''),
            path: this.getPathFromDisplayName(link.displayText ?? '')
        } as CommonLink));
        return arrLink;
    }

    getPathFromFileName(fileName: string): string {
        //const adjustedFileName = /\.[a-zA-Z]{1,4}$/.test(fileName) ? fileName : `${fileName}.md`;
        const adjustedFileName = fileName
        const files = this.app.vault.getFiles();
        const file = files.find((file: TFile) => file.name.toLowerCase() === adjustedFileName.toLowerCase() || file.basename === adjustedFileName.toLowerCase()) ;
        return file ? file.path : `*${fileName}* No Mathed File`;
    }

    getPathFromDisplayName(displayName: string): string {
        const file = this.getTFileFromLinkDisplayName(displayName)
        if(!file) return displayName;
        return file.path;
    }

    getFileNameFromDisplayName(displayName: string): string {
        const path = this.getPathFromDisplayName(displayName)
        if(!path) return displayName;
        return this.getFileNameFromPath(path);
    }

    getTFileFromLinkDisplayName(displayName: string, sourcePath: string = ''): TFile | null {
        const allFiles = this.app.vault.getFiles();
        const file = allFiles
            .find(file => file.basename === displayName || file.name === displayName);
        if(!file) return null;
        return file;
        // return this.app.metadataCache.getFirstLinkpathDest(displayName, sourcePath);
    }

    getArrayPathOfOneDepthFromArrPath(arrPath: string[]): string[] {
        const arrPathOfOneDepth = arrPath.map(path => this.getArrPathOfOneDepthFromPath(path));
        const result = Array.from(new Set(arrPathOfOneDepth.flat()));
        return result;
    }

    getArrPathOfOneDepthFromPath(path: string): string[] {
        const arrPathOfOutlink = this.getArrPathOfOutlinkFromPath(path);
        const arrPathOfBacklink = this.getArrPathOfBacklinkFromPath(path);

        const arrPathOfOneDepth = [...arrPathOfOutlink, ...arrPathOfBacklink];
        
        // Remove duplicates using Set
        const uniqueArrPathOfOneDepth = Array.from(new Set(arrPathOfOneDepth));
        
        return uniqueArrPathOfOneDepth;
    }

    getArrTagFromPath(path: string): string[] {
        const tFile = this.getTFileFromPath(path);
        if(!tFile) return [];
        return this.getArrTagFromTFile(tFile);
    }

    getArrTagFromTFile(tFile: TFile): string[] {
        const metadata = this.app.metadataCache.getFileCache(tFile);
        if(!metadata) return [];
        const bodyTags = metadata.tags?.map(t => t.tag.slice(1)) ?? [];
        const frontmatter = metadata.frontmatter;
        let frontmatterTags: string[] = [];
        if (frontmatter) {
          if (frontmatter.tag) {
            if (Array.isArray(frontmatter.tag)) {
              frontmatterTags = frontmatterTags.concat(frontmatter.tag.map(tag => 
                typeof tag === 'string' && tag.includes(',') ? tag.split(',')[0].trim() : tag
              ));
            } else if (typeof frontmatter.tag === 'string') {
              frontmatterTags.push(frontmatter.tag.includes(',') ? frontmatter.tag.split(',')[0].trim() : frontmatter.tag);
            }
          }
          if (frontmatter.tags) {
            if (Array.isArray(frontmatter.tags)) {
                if (frontmatter.tags.length > 0 && typeof frontmatter.tags[0] === 'string' && frontmatter.tags[0].includes(',')) {
                    frontmatterTags.push(frontmatter.tags[0].split(',')[0].trim());
                } else {
                    frontmatterTags = frontmatterTags.concat(frontmatter.tags);
                }
            } else if (typeof frontmatter.tags === 'string') {
                if (frontmatter.tags.includes(',')) {
                    frontmatterTags = frontmatterTags.concat(frontmatter.tags.split(',').map(tag => tag.trim()));
                } else {
                    frontmatterTags.push(frontmatter.tags.trim());
                }
            }
          }
        }
        const resultTags = bodyTags.concat(frontmatterTags);
        return resultTags;
    }

    getAllTFileOfVault(): TFile[] {
        return this.app.vault.getFiles();
    }

    getAllPathOfVault(): string[] {
        const arrTFile = this.getAllTFileOfVault();
        const arrPath = arrTFile.map(t => t.path);
        return arrPath;
    }

    getVaultName(): string {
        return this.app.vault.getName();
    }

    openFileFromTFile(tFile: TFile): void {
        this.app.workspace.getLeaf().openFile(tFile);
    }

    notice(message: string): void {
        new Notice(message);
    }

    /* Typescript, Javascript 기본 문법만 사용 */
    getFileNameFromPath(path: string): string {
        return path.split('/').pop() || '';
    }

    getBaseNameFromPath(path: string): string {
        const fileName = this.getFileNameFromPath(path);
        return fileName.split('.').slice(0, -1).join('.') || fileName;
    }

    getFolderPathFromPath(path: string): string {
        return path.split('/').slice(0, -1).join('/') || '';
    }

    shuffledArray(array: any[]): any[] {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getArrDifferenceFromArrAAndArrB(arrA: string[], arrB: string[]): string[] {
        return arrA.filter(item => !arrB.includes(item));
    }
}
