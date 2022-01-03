import { DatabaseService } from './../../dbservice/DatabaseService';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import { NullableId } from '@feathersjs/feathers';
import config from '../../appconfig';
import { buildLocationInfo } from '../../responsebuilder/placesBuilder';
export class Location extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
    }
  
    async update(id: NullableId, data: any, params: any): Promise<any> {
        if (params.user.id) {
            if (data.network_address && data.network_port && data.name && data.path && data.online && data.placeId && data.domainId) {
                const locationNetworkAddress = data.network_address;
                const locationNetworkPort = data.network_port;
                const locationPath = data.path;
                const locationConnected = data.online;
                const locationPlaceId = data.placeId;
                const locationDomainId = data.domainId;
                if (
                    locationNetworkAddress != '' &&
                typeof locationNetworkAddress != 'undefined' &&
                locationNetworkPort != '' &&
                typeof locationNetworkPort != 'undefined' &&
                locationPath != '' &&
                typeof locationPath != 'undefined' &&
                 locationConnected != '' &&
                typeof locationConnected != 'undefined' &&
                 locationPlaceId != '' &&
                typeof locationPlaceId != 'undefined' &&
                locationDomainId != '' &&
                  typeof locationDomainId != 'undefined') {
                    const newDataObject = {
                        locationNetworkAddress: data.network_address,
                        locationNetworkPort: data.network_port,
                        locationPath: data.path,
                        locationConnected: data.online,
                        locationPlaceId: data.placeId,
                        locationDomainId:data.domainId
                    };
                    await this.patchData(config.dbCollections.accounts, params.user.id, newDataObject);
                    const abc = await this.getData(config.dbCollections.accounts, params.user.id);
                    const location = await buildLocationInfo(abc);
                    return Promise.resolve({ location });
                } else {
                    throw new Error('Badly formatted request');
                }
            } else {
                throw new Error('Badly formatted request');
            }
        } else {
            throw new Error('Not logged In');
        }
    }
  

    async find(params?: any): Promise<any> {
        if (params.user) {
            const location = await buildLocationInfo(params.user);
            return Promise.resolve({ location });
        } else {
            throw new Error('Not logged In');
        }
    }
  
}
