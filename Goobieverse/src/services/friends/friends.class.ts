import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { DatabaseService } from './../../dbservice/DatabaseService';
import { Application } from '../../declarations';
import config from '../../appconfig';
import { Response } from '../../utils/response'; 
import { buildSimpleResponse } from '../../responsebuilder/responseBuilder';
import { messages } from '../../utils/messages';

export class Friends extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }

    /**
   * POST Friend
   *
   * @remarks
   * This method is part of the POST friend
   * Set a user as a friend. The other user must already have a "connection" with this user.
   * Request Type - POST
   * End Point - API_URL/friends
   * 
   * @requires -authentication
   * @param requestBody - {"username": stringUsername}
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */

    async create(data: any, params?: any): Promise<any> {
        if (data && data.username) {
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: params.user.id } });
            if (ParticularUserData.data[0].connections.includes(data.username)) {
                const newParticularUserData = ParticularUserData.data[0];
                newParticularUserData.friends.push(data.username);
                await this.patchData(config.dbCollections.accounts, params.user.id,newParticularUserData);
                return Promise.resolve({});
            } else {
                return Response.error(messages.common_messages_cannot_add_friend_who_not_connection);
            }
        } else {
            return Response.error(messages.common_messages_badly_formed_request);
        }
    }

    /**
   * GET Friend
   *
   * @remarks
   * Return a list of friends of the requesting account.
   * Request Type - GET
   * End Point - API_URL/friends
   * 
   * @requires -authentication
   * @returns -  {"status": "success", "data": {"friends": [username,username,...]} or  { status: 'failure', message: 'message'}
   * 
   */

    async find(params?: any): Promise<any> {
        if (params.user.friends) {
            const friends = params.user.friends;
            return Promise.resolve(buildSimpleResponse({ friends }));
        } else {
            throw new Error(messages.common_messages_no_friend_found);
        }
    }

    /**
   * Delete Friend
   *
   * @remarks
   * This method is part of the delete friend
   * Request Type - DELETE
   * End Point - API_URL/friends/{username}
   * 
   * @requires @param friend -username (URL param)
   * @requires -authentication
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */

    async remove(id: string, params?: any): Promise<any> {
        if (params.user.friends) {
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: params.user.id } });
            const friends = ParticularUserData.data[0].friends.filter(function (value:string) {
                return value !== id;
            });
            ParticularUserData.data[0].friends = friends; 
            const newParticularUserData = ParticularUserData.data[0];
            await this.patchData(config.dbCollections.accounts,params.user.id,newParticularUserData);
            return Promise.resolve({});
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }


}
