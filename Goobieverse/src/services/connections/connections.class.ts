import {  MongoDBServiceOptions } from 'feathers-mongodb';
import { DatabaseService } from './../../dbservice/DatabaseService';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appconfig';
import { Response } from '../../utils/response';
import { isValidObject } from '../../utils/Misc';
import { AccountModel } from '../../interfaces/AccountModel';
import { buildAccountInfo } from '../../responsebuilder/accountsBuilder';

export class Connections extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }
  
    async create(data: any, params?: any): Promise<any> {
        if (data && data.username) {
            const userData: any = await this.getData(config.dbCollections.accounts, params.user.id);
            userData.connections.push(data.username);
            const addUserData = await this.patchData(config.dbCollections.accounts, params.user.id, userData);
            if (isValidObject(addUserData)) {
                return Promise.resolve({});
            } else {
                return Response.error('cannot add connections this way');
            }
        } else {
            return Response.error('Badly formed request');
        }
    }

    async remove(id: string, params?: any): Promise<any> {
        if (params.user.connections) {
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: params.user.id } });
            const connections = ParticularUserData.data[0].connections.filter(function (value:string) {
                return value !== id;
            });
            ParticularUserData.data[0].connections = connections; 
            const newParticularUserData = ParticularUserData.data[0];
            await this.patchData(config.dbCollections.accounts,params.user.id,newParticularUserData);
        } else {
            throw new Error('Not logged in');
        }
    }
    
    async find(params?: any): Promise<any> {
        const perPage = parseInt(params?.query?.per_page) || 10;
        const skip = ((parseInt(params?.query?.page) || 1) - 1) * perPage;
        const users :any = await this.findDataToArray(config.dbCollections.accounts, {
            query: {
                accountIsActive: true,
                $select: ['username','connections'],
                $skip: skip,
                $limit: perPage,
            },
        });
      
        let userList:AccountModel[] = [];

        if(users instanceof Array){
            userList = users as Array<AccountModel>;
        }else{
            userList = users.data as Array<AccountModel>;  
        }
 
        
        const user: Array<any> = [];
        (userList as Array<AccountModel>)?.forEach(async (element) => {
     
            user.push(await buildAccountInfo(element));
        });

      
        return Promise.resolve({ user });
    }


}
