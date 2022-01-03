import { DomainModel } from './../../interfaces/DomainModel';
import { Params,NullableId } from '@feathersjs/feathers';
import { DatabaseService } from '../../dbservice/DatabaseService';
import { DatabaseServiceOptions} from '../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appconfig';
import { buildDomainInfoV1 } from '../../responsebuilder/domainsBuilder';
import { isAdmin } from '../../utils/Utils';
import { AccountModel } from '../../interfaces/AccountModel';
import { IsNotNullOrEmpty, IsNullOrEmpty } from '../../utils/Misc';
import { messages } from '../../utils/messages';
import { buildPaginationResponse,buildSimpleResponse } from '../../responsebuilder/responseBuilder';

export class Domains extends DatabaseService {
    
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
    }

    async find(params?: Params): Promise<any> {
        console.log(params);
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page) || 1;
        const skip = ((page) - 1) * perPage;
        let asAdmin = params?.query?.asAdmin === 'true' ? true : false;
        const targetAccount = params?.query?.account ?? '';
        const loginUserId = params?.user?.id ?? '';

        if ( asAdmin && IsNotNullOrEmpty(params?.user) && isAdmin(params?.user as AccountModel) && IsNullOrEmpty(targetAccount)) {
            asAdmin = true;
        } else {
            asAdmin = false;
        }

        const queryParams:any = {};

        if(asAdmin && IsNotNullOrEmpty(targetAccount)){
            queryParams.sponsorAccountId = targetAccount;
        }else if(!asAdmin){
            queryParams.sponsorAccountId = loginUserId;
        }

        const domainsData = await this.findData(config.dbCollections.domains, 
            {
                query: {
                    ...queryParams,
                    $skip: skip,
                    $limit: perPage
                }
            });
        
        const domainList : DomainModel[] = domainsData.data;
      
        const domains: Array<any> = [];
        domainList.forEach(async (element) => {
            domains.push(await buildDomainInfoV1(this,element));
        });
        return Promise.resolve(buildPaginationResponse({domains:domains},page,perPage,Math.ceil(domainsData.total/perPage),domainsData.total));
        
    }

    async get(id: NullableId): Promise<any> {
        if(IsNotNullOrEmpty(id) && id){
            const objDomain = await this.getData(config.dbCollections.domains,id);
            if (IsNotNullOrEmpty(objDomain)) {
                const domain = await buildDomainInfoV1(this,objDomain);
                return Promise.resolve(buildSimpleResponse({ domain }));
            } 
        }
        throw new Error(messages.common_messages_target_domain_notfound);
    }

    async patch(id: NullableId, data: any): Promise<any> {
        
        if(IsNotNullOrEmpty(id) &&  id){
            const domainData = data.domain;
            const updateDomain: any = {};
            if(IsNotNullOrEmpty(domainData?.name)){
                updateDomain.name = domainData.name;
            }
            
            if(IsNotNullOrEmpty(domainData.version)){
                updateDomain.version = domainData.version;
            }

            if(IsNotNullOrEmpty(domainData.protocol)){
                updateDomain.protocol = domainData.protocol;
            }

            if(IsNotNullOrEmpty(domainData.network_address)){
                updateDomain.networkAddr = domainData.network_address;
            }
            
            if(IsNotNullOrEmpty(domainData.restricted)){
                updateDomain.restricted = domainData.restricted;
            }

            if(IsNotNullOrEmpty(domainData.capacity)){
                updateDomain.capacity = domainData.capacity;
            }
            if(IsNotNullOrEmpty(domainData.description)){
                updateDomain.description = domainData.description;
            }

            if(IsNotNullOrEmpty(domainData.maturity)){
                updateDomain.maturity = domainData.maturity;
            }
            
            if(IsNotNullOrEmpty(domainData.restriction)){
                updateDomain.restriction = domainData.restriction;
            }

            if(IsNotNullOrEmpty(domainData.managers)){
                updateDomain.managers = domainData.managers;
            }

            if(IsNotNullOrEmpty(domainData.tags)){
                updateDomain.tags = domainData.tags;
            }

            if(IsNotNullOrEmpty(domainData.heartbeat)){
                if(IsNotNullOrEmpty(domainData.heartbeat.num_users)){
                    updateDomain.numUsers = domainData.heartbeat.num_users;
                }

                if(IsNotNullOrEmpty(domainData.heartbeat.anon_users)){
                    updateDomain.anonUsers = domainData.heartbeat.anon_users;
                }   
            }

            await this.patchData(config.dbCollections.domains,id,updateDomain);
            return Promise.resolve();
        }else{
            throw new Error(messages.common_messages_target_domain_notfound);
        }
    }

    async remove(id: NullableId): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            await this.deleteData(config.dbCollections.domains,id);
            return Promise.resolve({});
        } else {
            throw new Error(messages.common_messages_target_domain_notfound);
        }
    }

}
