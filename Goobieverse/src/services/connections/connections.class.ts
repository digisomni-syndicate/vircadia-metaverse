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
import { messages } from '../../utils/messages';

export class Connections extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }

    /**
   * POST Connection
   *
   * @remarks
   * This method is part of the POST connection
   * Request Type - POST
   * End Point - API_URL/connections
   * 
   * @requires -authentication
   * @param requestBody - {"username": stringUsername}
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */
    
    async create(data: any, params?: any): Promise<any> {
        if (data && data.username) {
            const loginUser = extractLoggedInUserFromParams(params);
            const userData: any = await this.getData(config.dbCollections.accounts, loginUser.id);
            userData.connections.push(data.username);
            const addUserData = await this.patchData(config.dbCollections.accounts, loginUser.id, userData);
            if (IsNotNullOrEmpty(addUserData)) {
                return Promise.resolve({});
            } else {
                return Response.error(messages.common_messages_cannot_add_connections_this_way);
            }
        } else {
            return Response.error(messages.common_messages_badly_formed_request);
        }
    }


    /**
   * Delete Connection
   *
   * @remarks
   * This method is part of the delete connection
   * Request Type - DELETE
   * End Point - API_URL/connections/{username}
   * 
   * @requires @param acct -username (URL param)
   * @requires -authentication
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */

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
            throw new Error(messages.common_messages_not_logged_in);
        }
    }


    /**
   * GET Connection
   *
   * @remarks
   * This method is part of the get list of users and their connection
   * Request Type - GET
   * End Point - API_URL/connections
   * 
   * @requires -authentication
   * @returns - { data:{user:[{...},{...}]},,current_page:1,per_page:10,total_pages:1,total_entries:5}}, or { status: 'failure', message: 'message'}
   * 
   */
    
    async find(params?: any): Promise<any> {
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page) || 1;
        const skip = ((page) - 1) * perPage;

        const usersData = await this.findData(config.dbCollections.accounts, {
            query: {
                accountIsActive: true,
                $skip: skip,
                $limit: perPage,
            },
        });
      
        const userList:AccountInterface[] = usersData.data;  
                
        const users: Array<any> = [];
        (userList as Array<AccountInterface>)?.forEach(async (element) => {
            users.push(await buildAccountInfo(element));
        });
      
        return Promise.resolve(buildPaginationResponse({ users },page,perPage,Math.ceil(usersData.total/perPage),usersData.total));
    }


}
