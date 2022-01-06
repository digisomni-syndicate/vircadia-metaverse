import { DatabaseService } from '../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appConfig';
import { Response } from '../../utils/response';
import { IsNotNullOrEmpty } from '../../utils/Misc';
import { AccountInterface } from '../../common/interfaces/AccountInterface';
import { buildAccountInfo } from '../../common/responsebuilder/accountsBuilder';
import { buildPaginationResponse } from '../../common/responsebuilder/responseBuilder';
import { extractLoggedInUserFromParams } from '../auth/auth.utils';

export class Connections extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }
  
    async create(data: any, params?: any): Promise<any> {
        if (data && data.username) {
            const loginUser = extractLoggedInUserFromParams(params);
            const userData: any = await this.getData(config.dbCollections.accounts, loginUser.id);
            userData.connections.push(data.username);
            const addUserData = await this.patchData(config.dbCollections.accounts, loginUser.id, userData);
            if (IsNotNullOrEmpty(addUserData)) {
                return Promise.resolve({});
            } else {
                return Response.error('cannot add connections this way');
            }
        } else {
            return Response.error('Badly formed request');
        }
    }

    async remove(id: string, params?: any): Promise<any> {
        const loginUser = extractLoggedInUserFromParams(params);
        if (loginUser?.connections) {
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: loginUser.id } });
            const connections = ParticularUserData.data[0].connections.filter(function (value:string) {
                return value !== id;
            });
            ParticularUserData.data[0].connections = connections; 
            const newParticularUserData = ParticularUserData.data[0];
            await this.patchData(config.dbCollections.accounts,loginUser.id,newParticularUserData);
            return Promise.resolve({});
        } else {
            throw new Error('Not logged in');
        }
    }
    
    async find(params?: any): Promise<any> {
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page) || 1;
        const skip = ((page) - 1) * perPage;

        const usersData = await this.findData(config.dbCollections.accounts, {
            query: {
                accountIsActive: true,
                $select: ['username','connections'],
                $skip: skip,
                $limit: perPage,
            },
        });
      
        const userList:AccountInterface[] = usersData.data;  
                
        const user: Array<any> = [];
        (userList as Array<AccountInterface>)?.forEach(async (element) => {
            user.push(await buildAccountInfo(element));
        });
      
        return Promise.resolve(buildPaginationResponse({ user },page,perPage,Math.ceil(usersData.total/perPage),usersData.total));
    }


}
