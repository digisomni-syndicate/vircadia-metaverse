import { Id, NullableId, Params} from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import S3Provider from '../storageprovider/s3.storage';
import { useStorageProvider } from '../storageprovider/storageprovider';
import {
    MAX_AVATAR_FILE_SIZE,
    MIN_AVATAR_FILE_SIZE,
    PRESIGNED_URL_EXPIRATION_DURATION,
} from '../../../utils/constants';
import config from '../../../appConfig';

import { DatabaseService } from '../../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../../common/dbservice/DatabaseServiceOptions';


/**
 * A class for Upload service
 *
 */
export class UploadPresigned extends DatabaseService {
    
    docs: any;
    storageProvider: any;
    s3 = new S3Provider();

    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);    
        this.storageProvider = useStorageProvider();
    }
 

    async get(id: Id, params: Params): Promise<any> {
        const key = this.getKeyForFilename(
            params['identity-provider'].userId,
            params.query?.fileName,
            params.query?.isPublicAvatar
        );
        return await this.storageProvider.getSignedUrl(
            key,
            PRESIGNED_URL_EXPIRATION_DURATION || 3600, // Expiration duration in Seconds
            [
                { acl: 'public-read' },
                [
                    'content-length-range',
                    MIN_AVATAR_FILE_SIZE,
                    MAX_AVATAR_FILE_SIZE,
                ], // Max size 15 MB
            ]
        );
    }

    async remove(id: NullableId, params: Params): Promise<any> {
        const keys = params?.query?.keys || [];
        const data = await this.s3.deleteResources(keys);
        await this.deleteMultipleData(config.dbCollections.asset,{query:{key: {$in: keys,}}});
        return { data };
    }

    getKeyForFilename = (
        userId: string,
        fileName: string,
        isPublicAvatar?: boolean
    ): string => {
        return isPublicAvatar === true
            ? `${config.aws.s3.avatarDir}/${fileName}`
            : `${config.aws.s3.avatarDir}${config.aws.s3.s3DevMode ? '/' + config.aws.s3.s3DevMode : ''}/${userId}/${fileName}`;
    };
}
