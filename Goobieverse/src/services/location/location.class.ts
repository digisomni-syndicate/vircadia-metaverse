import { DatabaseService } from './../../dbservice/DatabaseService';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import { NullableId } from '@feathersjs/feathers';
import config from '../../appconfig';
import { buildLocationInfo } from '../../responsebuilder/placesBuilder';
import { IsNotNullOrEmpty } from '../../utils/Misc';
import { buildSimpleResponse } from '../../responsebuilder/responseBuilder';
import { messages } from '../../utils/messages';

export class Location extends DatabaseService {
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
    }

    /**
   * Update location
   *
   * @remarks
   * This method is part of the update location
   * Request Type - PUT
   * End Point - API_URL/location
   * 
   * @requires -authentication
   * @param requestBody - {"network_address":"network_address","network_port":"3030","name":"Test name","path": "/X,Y,Z/X,Y,Z,W","online": "false","placeId":"random-place-id","domainId":"random-domain-id"}
   * @returns -     {"status": "success","data": {"location": { "root": {"domain": {"id":"","network_address":"","network_port":"","ice_server_address":"","name":""},"name": placeName,},"path": "/X,Y,Z/X,Y,Z,W","online": bool}}} or { status: 'failure', message: 'message'}
   * 
   */
  
    async update(id: NullableId, data: any, params: any): Promise<any> {
        if (params.user.id) {
            if (data.location) {
                const locationData= data.location;                
                const newDataObject:any = {};
                if(IsNotNullOrEmpty(locationData.network_address)){
                    newDataObject.locationNetworkAddress = locationData.network_address;
                }
                if(IsNotNullOrEmpty(locationData.node_id)){
                    newDataObject.locationNodeId = locationData.node_id;
                }
                if(IsNotNullOrEmpty(locationData.path)){
                    newDataObject.locationPath = locationData.path;
                }
                if(IsNotNullOrEmpty(locationData.connected) && typeof locationData.connected === 'boolean' ){
                    newDataObject.locationConnected = locationData.connected;
                }
                if(IsNotNullOrEmpty(locationData.place_id)){
                    newDataObject.locationPlaceId = locationData.place_id;
                }
                if(IsNotNullOrEmpty(locationData.domain_id)){
                    newDataObject.locationDomainId = locationData.domain_id;
                }
                if(IsNotNullOrEmpty(locationData.availability)){
                    newDataObject.availability = locationData.availability;
                }

                await this.patchData(config.dbCollections.accounts, params.user.id, newDataObject);
                const account = await this.getData(config.dbCollections.accounts, params.user.id);
                let domainModel:any;
                if(IsNotNullOrEmpty(account.locationDomainId)){
                    domainModel = await this.getData(config.dbCollections.domains,account.locationDomainId);
                }
                const location = await buildLocationInfo(account,domainModel);
                return Promise.resolve(buildSimpleResponse({location:location}));
            }else{
                throw new Error(messages.common_messages_badly_formed_request);
            }
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }
  
    /**
   * GET location
   *
   * @remarks
   * This method is part of the get location
   * Request Type - GET
   * End Point - API_URL/location
   * 
   * @requires -authentication
   * @returns - {"status": "success","data": {"location": { "root": {"domain": {"id":"","network_address":"","network_port":"","ice_server_address":"","name":""},"name": placeName,},"path": "/X,Y,Z/X,Y,Z,W","online": bool}}} or { status: 'failure', message: 'message'}
   * 
   */

    async find(params?: any): Promise<any> {
        if (params.user) {
            const domain = await this.getData(config.dbCollections.domains,params.user.locationDomainId);
            const location = await buildLocationInfo(params.user,domain);
            return Promise.resolve(buildSimpleResponse({ location }));
        } else {
            throw new Error(messages.common_messages_not_logged_in);
        }
    }
  
}
