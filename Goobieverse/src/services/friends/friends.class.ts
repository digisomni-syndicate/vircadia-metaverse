import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { DatabaseService } from '../../common/dbservice/DatabaseService';
import { Application } from '../../declarations';
import config from '../../appConfig';
import { Response } from '../../utils/response'; 

import { buildSimpleResponse } from '../../common/responsebuilder/responseBuilder';
import { extractLoggedInUserFromParams } from '../auth/auth.utils';
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
            const loginUser = extractLoggedInUserFromParams(params);
            const ParticularUserData: any = await this.findData(config.dbCollections.accounts, { query: { id: loginUser.id } });
            if (ParticularUserData.data[0].connections.includes(data.username)) {
                const newParticularUserData = ParticularUserData.data[0];
                newParticularUserData.friends.push(data.username);
                await this.patchData(config.dbCollections.accounts, loginUser.id,newParticularUserData);
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
        const loginUser = extractLoggedInUserFromParams(params);
        if (loginUser?.friends) {
            const friends = loginUser.friends;
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
            throw new Error(messages.common_messages_not_logged_in);
        }
    }


}
