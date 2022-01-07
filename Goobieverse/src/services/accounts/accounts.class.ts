
import { RequestType } from '../../common/sets/RequestType';
import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { Params, Id, NullableId } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { DatabaseService } from '../../common/dbservice/DatabaseService';
import config from '../../appConfig';
import { AccountInterface } from '../../common/interfaces/AccountInterface';
import { RequestInterface } from '../../common/interfaces/RequestInterface';
import { buildAccountInfo } from '../../common/responsebuilder/accountsBuilder';
import { IsNotNullOrEmpty } from '../../utils/Misc';
import {
    isAdmin,
    dateWhenNotOnline,
    couldBeDomainId,
    validateEmail,
} from '../../utils/Utils';
import { messages } from '../../utils/messages';
import { VKeyedCollection, SArray } from '../../utils/vTypes';
import { buildPaginationResponse,buildSimpleResponse } from '../../common/responsebuilder/responseBuilder';
import { extractLoggedInUserFromParams } from '../auth/auth.utils';

export class Accounts extends DatabaseService {
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
    }
    
    /**
   * Verify user
   *
   * @remarks
   * This method is part of the Verify user 
   * Request Type - GET
   *  End Point - API_URL/accounts/verify/email?a={accountId}&v={verificationCode}
   *  
   * @requires @param a - User account
   * @requires @param v - User verification code
   * @returns After verification redirect to success or fail verification page 
   * 
   * 
   */

    /**
   * Returns the Accounts
   *
   * @remarks
   * This method is part of the get list of accounts 
   * Request Type - GET
   * End Point - API_URL/accounts?per_page=10&page=1 ....
   * 
   * @param per_page - page size
   * @param page - page number
   * @param filter - Connections|friends|all
   * @param status - Online|domainId
   * @param search - WildcardSearchString
   * @param acct - Account id
   * @param asAdmin - true | false if logged in account is administrator, list all accounts. Value is optional.
   * @returns - Paginated accounts { data:{accounts:[{...},{...}]},current_page:1,per_page:10,total_pages:1,total_entries:5}
   * 
   */

    async find(params?: Params): Promise<any> {
        const loginUser = extractLoggedInUserFromParams(params);
        if(IsNotNullOrEmpty(params?.query?.a) && IsNotNullOrEmpty(params?.query?.v)) {
            const accountId = params?.query?.a;
            const verificationCode = params?.query?.v;
            
            const requestList: RequestInterface[] = await this.findDataToArray(config.dbCollections.requests,{query:{requestingAccountId:accountId,verificationCode:verificationCode,requestType:RequestType.VERIFYEMAIL}});
            if(requestList.length >0 ){
                const RequestInterface = requestList[0];
                //if(RequestInterface.expirationTime && RequestInterface.expirationTime > new Date(Date.now())){
                await this.patchData(config.dbCollections.accounts,accountId,{accountEmailVerified:true,accountWaitingVerification:false});
                //}else{
                //  throw new Error(messages.common_messages_error_verify_request_expired);
                //}
                await this.deleteData(config.dbCollections.requests,RequestInterface.id??'');
                return Promise.resolve();
            }else{
                throw new Error(messages.common_messages_error_missing_verification_pending_request);
            }
        } else if (loginUser) {
            const perPage = parseInt(params?.query?.per_page) || 10;
            const page = parseInt(params?.query?.page) || 1;
            const skip = ((page) - 1) * perPage;

            let asAdmin = params?.query?.asAdmin === 'true' ? true : false;
            const filter: string[] = (params?.query?.filter ?? '').split(',');
            const status: string = params?.query?.status ?? '';
            const targetAccount = params?.query?.account ?? '';

            const filterQuery: any = {};

            if (asAdmin &&IsNotNullOrEmpty(loginUser) && isAdmin(loginUser as AccountInterface) && IsNotNullOrEmpty(targetAccount) ) {
                asAdmin = true;
            } else {
                asAdmin = false;
            }

            if (filter.length > 0) {
                if (!filter.includes('all')) {
                    if (
                        filter.includes('friends') &&
                        (loginUser?.friends ?? []).length > 0
                    ) {
                        filterQuery.friends = { $in: loginUser.friends };
                    }
                    if (
                        filter.includes('connections') &&
                        (loginUser.connections ?? []).length > 0
                    ) {
                        filterQuery.connections = {
                            $in: loginUser.connections,
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
                filterQuery.id = loginUser.id;
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

            let accountsList: AccountInterface[] = [];
 
            accountsList = accountData.data as Array<AccountInterface>;            

            const accounts: Array<any> = [];

            (accountsList as Array<AccountInterface>)?.forEach(async (element) => {
                accounts.push(await buildAccountInfo(element));
            });
            return Promise.resolve(buildPaginationResponse({accounts:accounts},page,perPage,Math.ceil(accountData.total/perPage),accountData.total));
        } else {
            throw new Error(messages.common_messages_unauthorized);
        }
    }

    /**
   * Returns the Account 
   *
   * @remarks
   * This method is part of the get account
   * Request Type - GET
   * End Point - API_URL/accounts/{accountId}
   * Access - Public, Owner, Admin
   * 
   * @param accountId - Account id (Url param)
   * @returns - Account { data:{account{...}}}
   * 
   */

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

    /**
   * Patch Account
   *
   * @remarks
   * This method is part of the patch account
   * Request Type - PATCH
   * End Point - API_URL/accounts/{accountId}
   * 
   * @requires @param acct - Account id (URL param)
   * @param requestBody - {accounts:{email:abc@test.com,public_key:key}}
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */

    async patch(id: NullableId, data: any, params: Params): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            const loginUser = extractLoggedInUserFromParams(params);
            if ((IsNotNullOrEmpty(loginUser) && isAdmin(loginUser as AccountInterface)) || id === loginUser.id) {
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
                        throw new Error(messages.common_messages_user_email_link_error);
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

    /**
   * Delete Account
   *
   * @remarks
   * This method is part of the delete account
   * Request Type - DELETE
   * End Point - API_URL/accounts/{accountId}
   * Access: Admin only
   * 
   * @requires @param acct - Account id (URL param)
   * @returns - {status: 'success'} or { status: 'failure', message: 'message'}
   * 
   */

    async remove(id: NullableId): Promise<any> {
        if (IsNotNullOrEmpty(id) && id) {
            const account = await this.getData(
                config.dbCollections.accounts,
                id
            );

            if (IsNotNullOrEmpty(account)) {
                this.deleteData(config.dbCollections.accounts, id);
                const accounts: AccountInterface[] = await this.findDataToArray(
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
