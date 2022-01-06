import { DatabaseService } from './../../dbservice/DatabaseService';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appconfig';
import { messages } from '../../utils/messages';
import { Params } from '@feathersjs/feathers';
import { IsNotNullOrEmpty } from '../../utils/Misc';
import { VKeyedCollection } from '../../utils/vTypes';

export class Current extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
    }

    /**
   * POST Current Place
   *
   * @remarks
   * This method is part of the POST current place
   * Request Type - POST
   * End Point - API_URL/current
   * 
   * @requires current -placeId and current_api_key
   * @param requestBody - {"placeId": "","current_api_key": "","current_attendance": "","current_images": "","current_info": ""}
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */
  
    async create(data: any): Promise<any> {
        if(IsNotNullOrEmpty(data.placeId)) {
            if (IsNotNullOrEmpty(data.current_api_key)) {
                const placeData = await this.getData(config.dbCollections.places, data.placeId);
                if (IsNotNullOrEmpty(placeData) && IsNotNullOrEmpty(placeData.currentAPIKeyTokenId)) {
                    const tokenData = await this.getData(config.dbCollections.tokens, placeData.currentAPIKeyTokenId);
                    if (IsNotNullOrEmpty(tokenData.token)) {
                        if (tokenData.token === data.current_api_key) {
                            const updates: VKeyedCollection = {};
                            if(IsNotNullOrEmpty(data.current_attendance)){
                                updates.current_attendance = data.current_attendance;
                            }
                            if (IsNotNullOrEmpty(data.current_images)) {
                                updates.current_images = data.current_images;
                            }
                            if (IsNotNullOrEmpty(data.current_info)) {
                                updates.current_info = data.current_info;
                            }
                            updates.currentLastUpdateTime = new Date();
                            await this.patchData(config.dbCollections.places, data.placeId, updates);
                            
                        } else {
                            throw new Error(messages.common_messages_current_api_key_not_match_place_key);
                        }
                    } else {
                        throw new Error(messages.common_messages_place_apikey_lookup_fail);
                    }
                } else {
                    throw new Error(messages.common_messages_no_place_by_placeId);
                }
            } else {
                throw new Error(messages.common_messages_no_current_api_key);
            }
        } else {
            throw new Error(messages.common_messages_no_placeId);
        }
    }
}
