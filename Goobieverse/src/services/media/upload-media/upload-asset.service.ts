import { Application } from '../../../declarations';
import multer from 'multer';
import { Params } from '@feathersjs/feathers';
import hooks from './upload-asset.hooks';
import express from 'express';
import { AdminAssetUploadArgumentsType } from '../../../common/interfaces/UploadAssetInterface';
import { useStorageProvider } from '../storageprovider/storageprovider';
import { getCachedAsset } from '../storageprovider/getCachedAsset';
import { extractLoggedInUserFromParams } from '../../auth/auth.utils';
import { isAdmin } from '../../../utils/Utils';
import { messages } from '../../../utils/messages';

const multipartMiddleware = multer({ limits: { fieldSize: Infinity } });

declare module '../../../declarations' {
    interface ServiceTypes {
        'upload-asset': any;
    }
}

export const addGenericAssetToS3AndStaticResources = async (
    app: Application,
    file: Buffer,
    args: AdminAssetUploadArgumentsType, 
    params?: Params
) => {
    const provider = useStorageProvider();
    // make userId optional and safe for feathers create
    const userIdQuery = args.userId ? { userId: args.userId } : {};

    const existingAsset = await app.service('static-resource').find({
        query: {
            staticResourceType: args.staticResourceType,
            // safely spread conditional params so we can query by name if it is given, otherwise fall back to key
            ...(args.name ? { name: args.name } : { key: args.key }),
            ...userIdQuery,
        },
        params
    });
    
    const promises: Promise<any>[] = [];

    // upload asset to storage provider
    promises.push(
        new Promise<void>(async (resolve) => {
            await provider.createInvalidation([args.key]);
            await provider.putObject({
                Key: args.key,
                Body: file,
                ContentType: args.contentType,
            });
            resolve();
        })
    );

    // add asset to static resources
    const assetURL = getCachedAsset(args.key, provider.cacheDomain);
    if (existingAsset.data.length) {
        promises.push(provider.deleteResources([existingAsset.data[0].id]));
        promises.push(
            app.service('static-resource').patch(
                existingAsset.data[0].id,
                {
                    url: assetURL,
                    key: args.key,
                },
                params
            )
        );
    } else {
        promises.push(
            app.service('static-resource').create(
                {
                    name: args.name ?? null,
                    mimeType: args.contentType,
                    url: assetURL,
                    key: args.key,
                    staticResourceType: args.staticResourceType,
                    storageProvider: provider.constructor.name,
                    ...userIdQuery,
                },
                params
            )
        );
    }

    await Promise.all(promises);
    return assetURL;
};

export default (app: Application): void => {
    app.use(
        'upload-asset',
        multipartMiddleware.any(),
        //multipartMiddleware.fields([{ name: 'media' }]),
        (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
            if (req?.feathers && req.method !== 'GET') {
                req.feathers.files = (req as any).files.media ? (req as any).files.media: (req as any).files;
                req.feathers.args = (req as any).args;
            }
            next();
        },
        {
            create: async (data: any, params?: Params) => {
            
                if(params?.files && params?.files?.length > 0 ){
                    if (data.type === 'user-avatar-upload') {
                        return await app.service('avatar').create(
                            {
                                avatar: params.files[0].buffer,
                                thumbnail: params.files[1].buffer,
                                ...data,
                            },
                            params
                        );
                    } else if (data.type === 'admin-file-upload') {
                        const loginUser = extractLoggedInUserFromParams(params);
                        if (!(await isAdmin(loginUser)))
                            return;
                        return Promise.all(
                            params.files.map((file:any, i:any) =>
                                addGenericAssetToS3AndStaticResources(
                                    app,
                                    file.buffer,
                                    params.args[i]
                                ),
                            params
                            )
                        );
                    } 
                }else{
                    throw new Error(messages.common_messages_asset_file_missing);
                }
            },
        }
    );
    const service = app.service('upload-asset');
    (service as any).hooks(hooks);
};
