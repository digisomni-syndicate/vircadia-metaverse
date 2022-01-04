import { RequestType } from './../../utils/sets/RequestType';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Params, Id, NullableId } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { DatabaseService } from './../../dbservice/DatabaseService';
import config from '../../appconfig';
import { AccountModel } from '../../interfaces/AccountModel';
import { RequestModel } from '../../interfaces/RequestModel';
import { buildAccountInfo } from '../../responsebuilder/accountsBuilder';
import { IsNotNullOrEmpty } from '../../utils/Misc';
import {
    isAdmin,
    dateWhenNotOnline,
    couldBeDomainId,
    validateEmail,
} from '../../utils/Utils';
import { messages } from '../../utils/messages';
import { VKeyedCollection, SArray } from '../../utils/vTypes';
import { buildPaginationResponse,buildSimpleResponse } from '../../responsebuilder/responseBuilder';


export class Accounts extends DatabaseService {
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
    }

    async find(params?: Params): Promise<any> {
        
        if(IsNotNullOrEmpty(params?.query?.a) && IsNotNullOrEmpty(params?.query?.v)) {
            const accountId = params?.query?.a;
            const verificationCode = params?.query?.v;
            
            const requestList: RequestModel[] = await this.findDataToArray(config.dbCollections.requests,{query:{requestingAccountId:accountId,verificationCode:verificationCode,requestType:RequestType.VERIFYEMAIL}});
            if(requestList.length >0 ){
                const requestModel = requestList[0];
                //if(requestModel.expirationTime && requestModel.expirationTime > new Date(Date.now())){
                await this.patchData(config.dbCollections.accounts,accountId,{accountEmailVerified:true,accountWaitingVerification:false});
                //}else{
                //  throw new Error(messages.common_messages_error_verify_request_expired);
                //}
                await this.deleteData(config.dbCollections.requests,requestModel.id??'');
                return Promise.resolve();
            }else{
                throw new Error(messages.common_messages_error_missing_verification_pending_request);
            }
        } else if (params?.user) {
            const loginUserId = params?.user?.id ?? '';
            const perPage = parseInt(params?.query?.per_page) || 10;
            const page = parseInt(params?.query?.page) || 1;
            const skip = ((page) - 1) * perPage;

            // Passed the request, get the filter parameters from the query.
            // Here we pre-process the parameters to make the DB query construction quicker.
            //    filter=connections|friends|all
            //    status=online|domainId
            //    search=wildcardSearchString
            // The administrator can specify an account to limit requests to
            // acct = account id
            //asAdmin=true: if logged in account is administrator, list all accounts. Value is optional.
            let asAdmin = params?.query?.asAdmin === 'true' ? true : false;
            const filter: string[] = (params?.query?.filter ?? '').split(',');
            const status: string = params?.query?.status ?? '';
            const targetAccount = params?.query?.account ?? '';

            const filterQuery: any = {};

            if (asAdmin &&IsNotNullOrEmpty(params?.user) && isAdmin(params?.user as AccountModel) && IsNotNullOrEmpty(targetAccount) ) {
                asAdmin = true;
            } else {
                asAdmin = false;
            }

            if (filter.length > 0) {
                if (!filter.includes('all')) {
                    if (
                        filter.includes('friends') &&
                        (params?.user?.friends ?? []).length > 0
                    ) {
                        filterQuery.friends = { $in: params?.user?.friends };
                    }
                    if (
                        filter.includes('connections') &&
                        (params?.user?.connections ?? []).length > 0
                    ) {
                        filterQuery.connections = {
                            $in: params?.user?.connections,
                        };
                    }
                }
            }

            if (IsNotNullOrEmpty(status)) {
                if (status === 'online') {
                    filterQuery.timeOfLastHeartbeat = {
                        $gte: dateWhenNotOnline(),
                    };
                } else if (couldBeDomainId(status)) {
                    filterQuery.locationDomainId = status;
                }
            }

            if (!asAdmin) {
                filterQuery.id = loginUserId;
            } else if (IsNotNullOrEmpty(targetAccount)) {
                filterQuery.id = targetAccount;
            }

            const accountData = await this.findData(
                config.dbCollections.accounts,
                {
                    query: {
                        ...filterQuery,
                        $skip: skip,
                        $limit: perPage,
                    },
                }
            );

            let accountsList: AccountModel[] = [];
 
            accountsList = accountData.data as Array<AccountModel>;            

            const accounts: Array<any> = [];

            (accountsList as Array<AccountModel>)?.forEach(async (element) => {
                accounts.push(await buildAccountInfo(element));
            });
            return Promise.resolve(buildPaginationResponse({accounts:accounts},page,perPage,Math.ceil(accountData.total/perPage),accountData.total));
        } else {
            throw new Error(messages.common_messages_unauthorized);
        }
    }

    async get(id: Id): Promise<any> {
        const objAccount = await this.getData(
            config.dbCollections.accounts,
            id
        );
        if (IsNotNullOrEmpty(objAccount)) {
            const account = await buildAccountInfo(objAccount);
            return Promise.resolve(buildSimpleResponse({ account }));
        } else {
            throw new Error(messages.common_messages_target_account_notfound);
        }
    }

    async patch(id: NullableId, data: any, params: Params): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            if (
                (IsNotNullOrEmpty(params?.user) &&
                    isAdmin(params?.user as AccountModel)) ||
                id === params?.user?.id
            ) {
                const valuesToSet = data.accounts ?? {};
                const updates: VKeyedCollection = {};
                if (IsNotNullOrEmpty(valuesToSet.email)) {
                    if (!validateEmail(valuesToSet.email)) {
                        throw new Error(
                            messages.common_messages_email_validation_error
                        );
                    }
                    const accountData = await this.findDataToArray(
                        config.dbCollections.accounts,
                        { query: { email: valuesToSet.email } }
                    );
                    if (accountData.length > 0 && accountData[0].id !== id) {
                        throw new Error(
                            messages.common_messages_user_email_link_error
                        );
                    }
                    updates.email = valuesToSet.email;
                }
                if (IsNotNullOrEmpty(valuesToSet.public_key)) {
                    updates.public_key = valuesToSet.public_key;
                }

                if (valuesToSet.hasOwnProperty('images')) {
                    if (IsNotNullOrEmpty(valuesToSet.images.hero)) {
                        updates.imagesHero = valuesToSet.images.hero;
                    }

                    if (IsNotNullOrEmpty(valuesToSet.images.tiny)) {
                        updates.imagesTiny = valuesToSet.images.tiny;
                    }

                    if (IsNotNullOrEmpty(valuesToSet.images.thumbnail)) {
                        updates.imagesThumbnail = valuesToSet.images.thumbnail;
                    }
                }
                await this.patchData(
                    config.dbCollections.accounts,
                    id,
                    updates
                );
                return Promise.resolve();
            } else {
                throw new Error(messages.common_messages_unauthorized);
            }
        } else {
            throw new Error(messages.common_messages_target_account_notfound);
        }
    }

    async remove(id: NullableId): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            const account = await this.getData(
                config.dbCollections.accounts,
                id
            );

            if (IsNotNullOrEmpty(account)) {
                this.deleteData(config.dbCollections.accounts, id);
                const accounts: AccountModel[] = await this.findDataToArray(
                    config.dbCollections.accounts,
                    {
                        query: {
                            $or: [
                                { connections: { $in: [account.username] } },
                                { friends: { $in: [account.username] } },
                            ],
                        },
                    }
                );

                for (const element of accounts) {
                    SArray.remove(element.connections, account.username);
                    SArray.remove(element.friends, account.username);
                    await super.patchData(
                        config.dbCollections.accounts,
                        element.id,
                        {
                            connections: element.connections,
                            friends: element.friends,
                        }
                    );
                }

                await this.deleteMultipleData(config.dbCollections.domains, {
                    query: { sponsorAccountId: account.id },
                });
                await this.deleteMultipleData(config.dbCollections.places, {
                    query: { accountId: account.id },
                });

                return Promise.resolve();
            } else {
                throw new Error(
                    messages.common_messages_target_account_notfound
                );
            }
        } else {
            
            throw new Error(messages.common_messages_target_account_notfound);
        }
    }
}
