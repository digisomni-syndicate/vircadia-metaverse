import { FileContentType } from '../../../common/interfaces/FileContentType';
import AWS from 'aws-sdk';
import { PresignedPost } from 'aws-sdk/clients/s3';
import path from 'path';
import S3BlobStore from 's3-blob-store';
import config from '../../../appConfig';
import { SignedURLResponse, StorageListObjectInterface, StorageObjectInterface, StorageProviderInterface} from '../../../common/interfaces/storageProvider';

export class S3Provider implements StorageProviderInterface {
    bucket = config.aws.s3.staticResourceBucket;
    cacheDomain = config.aws.cloudfront.domain;
    provider: AWS.S3 = new AWS.S3({
        accessKeyId: config.aws.keys.accessKeyId,
        secretAccessKey: config.aws.keys.secretAccessKey,
        region: config.aws.s3.region,
        s3ForcePathStyle: true,
    });

    blob: typeof S3BlobStore = new S3BlobStore({
        client: this.provider,
        bucket: config.aws.s3.staticResourceBucket,
        ACL: 'public-read',
    });

    cloudfront: AWS.CloudFront = new AWS.CloudFront({
        region: config.aws.s3.region,
        accessKeyId: config.aws.keys.accessKeyId,
        secretAccessKey: config.aws.keys.secretAccessKey,
    });

    getProvider = (): StorageProviderInterface => {
        return this;
    };

    checkObjectExistence = (key: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.provider.getObjectAcl(
                {
                    Bucket: this.bucket,
                    Key: key,
                },
                (err) => {
                    if (err) {
                        if (err.code === 'NoSuchKey') resolve(null);
                        else {
                            console.error(err);
                            reject(err);
                        }
                    } else {
                        reject(
                            new Error(`Object of key ${key} already exists`)
                        );
                    }
                }
            );
        });
    };

    getObject = async (key: string): Promise<StorageObjectInterface> => {
        return new Promise((resolve, reject) =>
            this.provider.getObject(
                {
                    Bucket: this.bucket,
                    Key: key,
                },
                (err, data) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve({
                            Body: data.Body as Buffer,
                            ContentType: data.ContentType || '',
                        });
                    }
                }
            )
        );
    };

    getObjectContentType = async (key: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.provider.headObject(
                {
                    Bucket: this.bucket,
                    Key: key,
                },
                (err, data) => {
                    if (err) {
                        console.log('Error:' + err);
                        reject(err);
                    } else {
                        resolve(data.ContentType);
                    }
                }
            );
        });
    };

    listObjects = async (
        prefix: string,
        results: any[],
        recursive = true,
        continuationToken?: string
    ): Promise<StorageListObjectInterface> => {
        return new Promise((resolve, reject) =>
            this.provider.listObjectsV2(
                {
                    Bucket: this.bucket,
                    ContinuationToken: continuationToken,
                    Prefix: prefix,
                    Delimiter: recursive ? undefined : '/',
                },
                (err, data) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        data.Contents = results.concat(data.Contents);
                        if (data.IsTruncated)
                            this.listObjects(
                                prefix,
                                data.Contents,
                                true,
                                data.NextContinuationToken
                            ).then((data) => resolve(data));
                        else resolve(data as StorageListObjectInterface);
                    }
                }
            )
        );
    };

    putObject = async (params: StorageObjectInterface): Promise<any> => {
        return new Promise((resolve, reject) =>
            this.provider.putObject(
                {
                    ACL: 'public-read',
                    Body: params.Body,
                    Bucket: this.bucket,
                    ContentType: params.ContentType,
                    Key: params.Key || '',
                },
                (err, data) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(data);
                    }
                }
            )
        );
    };

    createInvalidation = async (invalidationItems: any[]): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.cloudfront.createInvalidation(
                {
                    DistributionId: config.aws.cloudfront.distributionId,
                    InvalidationBatch: {
                        CallerReference: Date.now().toString(),
                        Paths: {
                            Quantity: invalidationItems.length,
                            Items: invalidationItems.map((item) =>
                                item[0] !== '/' ? `/${item}` : item
                            ),
                        },
                    },
                },
                (err, data) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(data);
                    }
                }
            );
        });
    };

    getStorage = (): typeof S3BlobStore => this.blob;

    getSignedUrl = async (
        key: string,
        expiresAfter: number,
        conditions:any
    ): Promise<SignedURLResponse> => {
        const result = await new Promise<PresignedPost>((resolve) => {
            this.provider.createPresignedPost(
                {
                    Bucket: this.bucket,
                    Fields: {
                        Key: key,
                    },
                    Expires: expiresAfter,
                    Conditions: conditions,
                },
                (err, data: PresignedPost) => {
                    resolve(data);
                }
            );
        });
        await this.createInvalidation([key]);
        return {
            fields: result.fields,
            cacheDomain: this.cacheDomain,
            url: result.url,
            local: false,
        };
    };

    deleteResources = (keys: string[]): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.provider.deleteObjects(
                {
                    Bucket: this.bucket,
                    Delete: {
                        Objects: keys.map((key) => {
                            return { Key: key };
                        }),
                    },
                },
                (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                }
            );
        });
    };

    listFolderContent = async (
        folderName: string,
        recursive = false
    ): Promise<FileContentType[]> => {
        const folderContent = await this.listObjects(
            folderName,
            [],
            recursive
        );
        // console.log('folderContent', folderContent)
        const promises: Promise<FileContentType>[] = [];
        // Files
        for (let i = 0; i < folderContent.Contents.length; i++) {
            promises.push(
                new Promise(async (resolve) => {
                    const key = folderContent.Contents[i].Key;
                    const regexx = /(?:.*)\/(?<name>.*)\.(?<extension>.*)/g;
                    const query = regexx.exec(key);
                    const url = `https://${this.bucket}.s3.${config.aws.s3.region}.amazonaws.com/${key}`;
                    const cont: FileContentType = {
                        key,
                        url,
                        name: query?.groups?.name || '',
                        type: query?.groups?.extension || '',
                    };
                    resolve(cont);
                })
            );
        }
        // Folders
        if(folderContent.CommonPrefixes){
            const commonPrefixes = folderContent.CommonPrefixes;
            for (let i = 0; i < commonPrefixes.length; i++) {
                promises.push(
                    new Promise(async (resolve) => {
                        const key = commonPrefixes[i].Prefix.slice(0,-1);
                        const url = `https://${this.bucket}.s3.${config.aws.s3.region}.amazonaws.com/${key}`;
                        const cont: FileContentType = {
                            key,
                            url,
                            name: key.split('/').pop() || '',
                            type: 'folder',
                        };
                        resolve(cont);
                    })
                );
            }
        }
        return await Promise.all(promises);
    };

    async moveObject(current: string,destination: string,isCopy = false,renameTo?: string) {
        const promises: any[] = [];
        promises.push(
            ...(await this._moveObject(current, destination, isCopy, renameTo))
        );
        await Promise.all(promises);
        return;
    }

    private async _moveObject(current: string,destination: string,isCopy = false,renameTo?: string) {
        const promises: any[] = [];
        const listResponse = await this.listObjects(current, [], true);

        promises.push(
            ...listResponse.Contents.map(async (file) => {
                const dest = `${destination}${file.Key.replace(listResponse.Prefix || '','')}`;
                let fileName =
                    renameTo != null ? renameTo : path.basename(current);
                let isDestAvailable = false;
                const f = fileName.split('.');
                let fileCount = 1;
                while (!isDestAvailable) {
                    try {
                        await this.checkObjectExistence(
                            path.join(dest, fileName)
                        );
                        isDestAvailable = true;
                    } catch {
                        fileName = '';
                        for (let i = 0; i < f.length - 1; i++) fileName += f[i];
                        fileName = `${fileName}(${fileCount}).${
                            f[f.length - 1]
                        }`;
                        fileCount++;
                    }
                }
                await this.provider
                    .copyObject({
                        Bucket: this.bucket,
                        CopySource: `/${this.bucket}/${file.Key}`,
                        Key: path.join(dest, fileName),
                    })
                    .promise();
                // we have to do these one by one after the copy
                if (!isCopy) {
                    await this.deleteResources([file.Key]);
                }
            })
        );

        // recursive copy sub-folders
        promises.push(
            ...listResponse.CommonPrefixes!.map(async (folder) =>
                this._moveObject(
                    `${folder.Prefix}`,
                    `${destination}${folder.Prefix.replace(listResponse.Prefix!,'')}`,
                    isCopy
                )
            )
        );

        return promises;
    }
}
export default S3Provider;
