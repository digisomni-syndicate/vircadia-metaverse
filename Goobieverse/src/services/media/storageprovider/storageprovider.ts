import S3Storage from './s3.storage';
import LocalStorage from './local.storage';
import { StorageProviderInterface } from '../../../common/interfaces/storageProvider';
import config from '../../../appConfig';

const provider: StorageProviderInterface =
  config.server.storageProvider === 'aws' ? new S3Storage() : new LocalStorage();

export const useStorageProvider = () => provider;
