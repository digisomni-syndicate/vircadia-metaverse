
import { Application } from '../../../declarations';
import { StorageProviderInterface } from '../../../common/interfaces/storageprovider';
import { FileContentType } from '../../../common/interfaces/FileContentType';
import { getCachedAsset } from '../storageprovider/getCachedAsset';
import { useStorageProvider } from '../storageprovider/storageprovider';
import { DatabaseService } from '../../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../../common/dbservice/DatabaseServiceOptions';

interface PatchParams {
    body: Buffer;
    contentType: string;
}

/**
 * A class for Managing files in FileBrowser
 *
 */

export class FileBrowserService extends DatabaseService {
    store: StorageProviderInterface;

    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.store = useStorageProvider();
    }

    find(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Return the metadata for each file in a directory
     * @param id
     * @param params
     * @returns
     */
    async get(directory: string): Promise<FileContentType[]> {
        if (directory.substr(0, 1) === '/') directory = directory.slice(1); // remove leading slash
        const result = await this.store.listFolderContent(directory);
        return result;
    }

    /**
     * Create a directory
     * @param directory
     * @param params
     * @returns
     */
    async create(directory:any) {
        if (directory.substr(0, 1) === '/') directory = directory.slice(1); // remove leading slash
        return this.store.putObject({
            Key: directory + '/',
            Body: Buffer.alloc(0),
            ContentType: 'application/x-empty',
        });
    }

    /**
     * Move content from one path to another
     * @param id
     * @param data
     * @param params
     * @returns
     */
    async update(
        from: string,
        data:any
    ) {
        // TODO
        throw new Error('[File Browser]: Temporarily disabled for instability. - TODO');
        return this.store.moveObject(from, data.destination, data.isCopy, data.renameTo);
    }

    /**
     * Upload file
     * @param id
     * @param data
     * @param params
     */
    async patch(path: string, data: PatchParams) {
        console.log(path, data);
        await this.store.putObject({
            Key: path,
            Body: data.body,
            ContentType: data.contentType,
        });
        return getCachedAsset(path, this.store.cacheDomain);
    }

    /**
     * Remove a directory
     * @param id
     * @param params
     * @returns
     */
    async remove(path: string) {
        const dirs = await this.store.listObjects(path + '/', [], true);
        return await this.store.deleteResources([
            path,
            ...dirs.Contents.map((a) => a.Key),
        ]);
    }
}
