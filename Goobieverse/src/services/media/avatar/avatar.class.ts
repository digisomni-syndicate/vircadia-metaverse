import { Params } from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import { DatabaseService } from '../../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../../common/dbservice/DatabaseServiceOptions';

import {
    uploadAvatarStaticResource,
    getAvatarFromStaticResources,
    AvatarUploadArguments,
} from './avatar-helper';

export class Avatar extends DatabaseService {
    app: Application;
    
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
        this.app = app;
    }

    async get(name: string, params: Params): Promise<any> {
        return (await getAvatarFromStaticResources(this.app, name))[0];
    }

    async find(params: Params): Promise<any> {
        return await getAvatarFromStaticResources(this.app);
    }

    async create(data: AvatarUploadArguments, params?: Params) {
        return uploadAvatarStaticResource(this.app, data, params);
    }

    async update(id: string, data: any, params: Params): Promise<void> {
        return Promise.resolve();
    }
    async patch(id: string, data: any, params: Params): Promise<void> {
        return Promise.resolve();
    }
    async remove(id: string, params: Params): Promise<void> {
        return Promise.resolve();
    }
}
