import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { DatabaseService } from '../../common/dbservice/DatabaseService';
import { Application } from '../../declarations';
import config from '../../appConfig';
import { Response } from '../../utils/response'; 
import { buildSimpleResponse } from '../../common/responsebuilder/responseBuilder';
import { extractLoggedInUserFromParams } from '../auth/auth.utils';
export class Friends extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }

    async create(data: any, params?: any): Promise<any> {
        if (data && data.username) {
            const loginUser = extractLoggedInUserFromParams(params);
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: loginUser.id } });
            if (ParticularUserData.data[0].connections.includes(data.username)) {
                const newParticularUserData = ParticularUserData.data[0];
                newParticularUserData.friends.push(data.username);
                await this.patchData(config.dbCollections.accounts, loginUser.id,newParticularUserData);
                return Promise.resolve({});
            } else {
                return Response.error('cannot add friend who is not a connection');
            }
        } else {
            return Response.error('Badly formed request');
        }
    }

    async find(params?: any): Promise<any> {
        const loginUser = extractLoggedInUserFromParams(params);
        if (loginUser?.friends) {
            const friends = loginUser.friends;
            return Promise.resolve(buildSimpleResponse({ friends }));
        } else {
            throw new Error('No friend found');
        }
    }

    async remove(id: string, params?: any): Promise<any> {
        const loginUser = extractLoggedInUserFromParams(params);
        if (loginUser?.friends) {
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: loginUser.id } });
            const friends = ParticularUserData.data[0].friends.filter(function (value:string) {
                return value !== id;
            });
            ParticularUserData.data[0].friends = friends; 
            const newParticularUserData = ParticularUserData.data[0];
            await this.patchData(config.dbCollections.accounts,loginUser.id,newParticularUserData);
            return Promise.resolve({});
        } else {
            throw new Error('Not logged in');
        }
    }


}
