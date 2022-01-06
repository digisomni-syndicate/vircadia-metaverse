import { DatabaseService } from '../../dbservice/DatabaseService';
import { DatabaseServiceOptions} from '../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import { messages } from '../../utils/messages';
import config from '../../appconfig';
import { PlaceModel } from '../../interfaces/PlaceModel';
import { Maturity } from '../../utils/sets/Maturity';
import { GenUUID, IsNotNullOrEmpty } from '../../utils/Misc';
import { buildPlaceInfo } from '../../responsebuilder/placesBuilder';
import { Id, NullableId, Params } from '@feathersjs/feathers';
import trim from 'trim';

export class Place extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
    }
    
    /**
   * POST place
   *
   * @remarks
   * This method is part of the POST place
   * Create a place entry. A place points to a domain so creation information contains a domainId of the domain the place points to.
   * The address is formatted as "/x,y,z/x,y,z,w".
   * Request Type - POST
   * End Point - API_URL/place
   * Access - DomainAccess , Admin
   * The requestor must be either an admin account or the account associated with the domain.
   * 
   * @requires -authentication
   * @param requestBody -  {"place": {"name": placeName,"description": descriptionText,"address": addressString,"domainId": domainId}}
   * @returns - {"status": "success","data": {"places": [{"placeId": string,"name": string,"displayName": string,"visibility": string,"path": string,"address": string,"description": string,"maturity": string,"tags": string[],"managers": string[],"domain": {"id": domainId,"name": domainName,"sponsorAccountId": string,"network_address": string,"ice_server_address": string,'version': string,'protocol_version': string,'active': boolean,"time_of_last_heartbeat": ISOStringDate,"time_of_last_heartbeat_s": integerUnixTimeSeconds,"num_users": integer},"thumbnail": URL,"images": [ URL, URL, ... ],"current_attendance": number,"current_images": string[],"current_info": string,"current_last_update_time": ISOStringDate,"current_last_update_time_s": integerUnixTimeSeconds},...],"maturity-categories": string[]}} or  { status: 'failure', message: 'message'}
   * 
   */

    async create(data: any, params: any): Promise<any> {
        if (params.user) {
            let requestedName: string;
            let requestedDesc: string;
            let requestedAddr: string;
            let requestedDomainId: string;

            if (data.place) {
                requestedName = trim(data.place.name);
                requestedDesc = trim(data.place.description);
                requestedAddr = trim(data.place.address);
                requestedDomainId = trim(data.place.domainId);
            } else {
                requestedName = data.place_id;
                requestedAddr = data.path;
                requestedDomainId = data.domain_id;
            }
          
            if (requestedName && requestedAddr && requestedDomainId) {
                const domainData = await this.getData(config.dbCollections.domains, requestedDomainId);
                if (domainData) {
                    const placeData = await this.findDataToArray(config.dbCollections.places, {  name: requestedName } );
                    const placeName = (placeData as Array<PlaceModel>)?.map(
                        (item) => item.name
                    );
                    if (!placeName.includes(requestedName)) {
                        const aToken: any = {};
                        aToken.id = GenUUID();
                        aToken.token = GenUUID();
                        aToken.refreshToken = GenUUID();
                        aToken.accountId = domainData.sponsorAccountId;
                        aToken.scope = ['place'];
                        aToken.whenCreated = new Date();
                        aToken.expirationTime = new Date(2399, 12);
                        const TokenData = await this.createData(config.dbCollections.tokens, aToken);
                        if (IsNotNullOrEmpty(TokenData)) {
                            const postPlace: any = {};
                            postPlace.id = GenUUID();
                            postPlace.whenCreated = new Date();
                            postPlace.currentAttendance = 0;
                            postPlace.currentAPIKeyTokenId = TokenData.id;
                            postPlace.name = requestedName;
                            postPlace.description = trim(data.place.description);
                            postPlace.path = requestedAddr;
                            postPlace.domainId = domainData.id;
                            postPlace.maturity = domainData.maturity ?? Maturity.UNRATED;
                            postPlace.managers = [params.user.username];
                           
                            await this.createData(config.dbCollections.places, postPlace);
                            const places = await buildPlaceInfo(postPlace, domainData);
                            return Promise.resolve({places});
                        }
                    } else {
                        throw new Error(messages.common_messages_place_exists);
                    }
                } else {
                    throw new Error(messages.common_messages_name_address_domainId_not_specific);
                }
            }
            else {
                throw new Error(messages.common_messages_name_address_domainId_must_specific);
            }
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }

    /**
   * GET place
   *
   * @remarks
   * Get the place information for one place.
   * Request Type - GET
   * End Point - API_URL/place/{placeId}
   * Access - DomainAccess , Admin
   * The requestor must be either an admin account or the account associated with the domain.
   * 
   * @requires @param placeId - Place id (Url param)
   * @returns - {"status": "success","data": {"places": [{"placeId": string,"name": string,"displayName": string,"visibility": string,"path": string,"address": string,"description": string,"maturity": string,"tags": string[],"managers": string[],"domain": {"id": domainId,"name": domainName,"sponsorAccountId": string,"network_address": string,"ice_server_address": string,'version': string,'protocol_version': string,'active': boolean,"time_of_last_heartbeat": ISOStringDate,"time_of_last_heartbeat_s": integerUnixTimeSeconds,"num_users": integer},"thumbnail": URL,"images": [ URL, URL, ... ],"current_attendance": number,"current_images": string[],"current_info": string,"current_last_update_time": ISOStringDate,"current_last_update_time_s": integerUnixTimeSeconds},...],"maturity-categories": string[]}} or  { status: 'failure', message: 'message'}
   * 
   */
  
    async get(id: Id): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            const placeData = await this.getData(config.dbCollections.places,id);
            const DomainData = await this.getData(config.dbCollections.domains, placeData.domainId);
      
            const newPlaceData = await buildPlaceInfo(placeData,DomainData);
            const data = {
                'place': newPlaceData,
                'maturity-categories': Maturity.MaturityCategories
            };
            return Promise.resolve({ data });
        } else {
            throw new Error(messages.common_messages_no_such_place);
        }
    }

    /**
   * Delete Place
   *
   * @remarks
   * This method is part of the delete place
   * Delete the place entry.
   * The requestor must be either an admin account or the account associated with the domain.
   * Request Type - DELETE
   * End Point - API_URL/place/{placeId}
   * Access - DomainAccess , Admin
   * 
   * @requires @param acct  Place id (Url param)
   * @requires -authentication
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */
  
    async remove(id: NullableId,params:any): Promise<any> {
        if (IsNotNullOrEmpty(params.user)) {
            if (IsNotNullOrEmpty(id) && id) {
                await this.deleteData(config.dbCollections.places, id);
            } else {
                throw new Error(messages.common_messages_target_place_notfound);
            }
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }


    /**
   * Update place
   *
   * @remarks
   * Update the place information.
   * If the field "place.pointee_query" is passed, that is presumed to be the ID of the domain that should be associated with the Place.
   * Request Type - Update
   * End Point - API_URL/place/{placeId}
   * Access - DomainAccess , Admin
   * The requestor must be either an admin account or the account associated with the domain.
   * 
   * @requires @param placeId - Place id (Url param)
   * @param requestBody - {'place': {'pointee_query': domainId,'path': stringAddress,'description': string,'thumbnail': stringURL}}
   * @returns - {"status": "success"} or  { status: 'failure', message: 'message'}
   * 
   */
  
  
    async update(id: Id, data: any, params: Params): Promise<any> {
        if (params.user) {
            if (IsNotNullOrEmpty(id) && id) {
                if (IsNotNullOrEmpty(data.place)) {
                    const updatePlace: any = {};
                    const placeData = data.place;
                    if (data.place.pointee_query) {
                        const getPlaceData = await this.getData(config.dbCollections.places,id);
                        // The caller specified a domain. Either the same domain or changing
                        if (data.place.pointee_query !== getPlaceData.domainId) {
                            getPlaceData.domainId = trim(data.place.pointee_query);
                            updatePlace.domainId = getPlaceData.domainId;
                        }
                        if(IsNotNullOrEmpty(placeData?.description)){
                            updatePlace.description = trim(placeData.description);
                        }
                        if(IsNotNullOrEmpty(placeData?.path)){
                            updatePlace.path = trim(placeData.path);
                        }
                        if(IsNotNullOrEmpty(placeData?.thumbnail)){
                            updatePlace.thumbnail = trim(placeData.thumbnail);
                        }
                        await this.patchData(config.dbCollections.places,id,updatePlace);
                    } 
                } else {
                    throw new Error(messages.common_messages_badly_formed_data);
                }
            } else {
                throw new Error(messages.common_messages_target_place_notfound);
            }
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }

    /**
   * GET all place
   *
   * @remarks
   * Get the list of places. Returns all the places.
   * Request Type - GET
   * End Point - API_URL/place
   * 
   * @returns - {"status": "success","data": {"places": [{"placeId": string,"name": string,"displayName": string,"visibility": string,"path": string,"address": string,"description": string,"maturity": string,"tags": string[],"managers": string[],"domain": {"id": domainId,"name": domainName,"sponsorAccountId": string,"network_address": string,"ice_server_address": string,'version': string,'protocol_version': string,'active': boolean,"time_of_last_heartbeat": ISOStringDate,"time_of_last_heartbeat_s": integerUnixTimeSeconds,"num_users": integer},"thumbnail": URL,"images": [ URL, URL, ... ],"current_attendance": number,"current_images": string[],"current_info": string,"current_last_update_time": ISOStringDate,"current_last_update_time_s": integerUnixTimeSeconds},...],"maturity-categories": string[]}} or  { status: 'failure', message: 'message'}
   * 
   */

    async find(params: Params): Promise<any>{
        // console.log(params.query, 'params');
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page_num) || 1;
        // const maturity = params?.query?.maturity;
        const skip = ((page) - 1) * perPage;

        const places: any[] = [];
        const allPlaces = await this.findDataToArray(config.dbCollections.places,{ query: {$skip: skip,$limit: perPage} });
        
        for (const element of allPlaces) {
            const domainData = await this.getData(config.dbCollections.domains,element.domainId );
            places.push(await buildPlaceInfo(element, domainData));
        }
        
        const data = {
            'places': places,
            'maturity-categories': Maturity.MaturityCategories
        };  
        return Promise.resolve({ data });
    }
  
}
