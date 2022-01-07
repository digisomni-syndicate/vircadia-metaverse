import { RequestType } from '../../common/sets/RequestType';
import { DatabaseService } from '../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appConfig';
import { Params } from '@feathersjs/feathers';
import { AccountInterface } from '../../common/interfaces/AccountInterface';
import { GenUUID, IsNotNullOrEmpty } from '../../utils/Misc';
import { Roles } from '../../common/sets/Roles';
import { IsNullOrEmpty } from '../../utils/Misc';
import { SArray } from '../../utils/vTypes';
import { sendEmail } from '../../utils/mail';
import path from 'path';
import fsPromises from 'fs/promises';

import { buildUserInfo } from '../../common/responsebuilder/accountsBuilder';
import { RequestInterface } from '../../common/interfaces/RequestInterface';
import { buildSimpleResponse,buildPaginationResponse } from '../../common/responsebuilder/responseBuilder';
import { extractLoggedInUserFromParams } from '../auth/auth.utils';
import { dateWhenNotOnline, couldBeDomainId,isAdmin } from '../../utils/Utils';
import { messages } from '../../utils/messages';


export class Users extends DatabaseService {
    app: Application;
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }

    /**
   * Create User 
   *
   * @remarks
   * This method is part of the create user
   * Request Type - POST
   * End Point - API_URL/users
   *  
   * @param body - {
   *                username:'',
   *                email:'',
   *                password:''
   *                }
   * @returns - {
   *                accountId: '',
   *                username: '',
   *                accountIsActive: false,
   *                accountWaitingVerification: true,
   *            }
   * 
   */
    async create(data: AccountInterface): Promise<any> {
        if (data.username && data.email && data.password) {
            const username: string = data.username.toString().trim();
            const email: string = data.email.toString().trim();
            const password: string = data.password.toString().trim();
            if (username) {
                const accountsName: AccountInterface[] = await this.findDataToArray(
                    config.dbCollections.accounts,
                    { query: { username: username } }
                );
                const name = (accountsName as Array<AccountInterface>)?.map(
                    (item) => item.username
                );
                if (!name.includes(username)) {
                    const accountsEmail: AccountInterface[] =
                        await this.findDataToArray(
                            config.dbCollections.accounts,
                            { query: { email: email } }
                        );
                    const emailAddress = (
                        accountsEmail as Array<AccountInterface>
                    )?.map((item) => item.email);
                    if (!emailAddress.includes(email)) {
                        const id = GenUUID();
                        const roles = [Roles.USER];
                        const friends: string[] = [];
                        const connections: string[] = [];
                        const whenCreated = new Date();
                        const accountIsActive = true;
                        const accountWaitingVerification = config.metaverseServer.enable_account_email_verification === 'true';
                        
                        const accounts = await this.createData(
                            config.dbCollections.accounts,
                            {
                                id: id,
                                username:username,
                                email:email,
                                password:password,
                                roles: roles,
                                whenCreated: whenCreated,
                                friends: friends,
                                connections: connections,
                                accountIsActive: accountIsActive,
                                accountWaitingVerification: accountWaitingVerification,
                            }
                        );
                        if (IsNotNullOrEmpty(accounts)) {
                            const emailToValidate = data.email;
                            const emailRegexp =
                                /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
                            if (emailRegexp.test(emailToValidate)) {
                                try {
                                    if(accountWaitingVerification) { 
                                        const adminAccountName =
                                            config.metaverseServer[
                                                'base_admin_account'
                                            ];
                                        if (
                                            accounts.username === adminAccountName
                                        ) {
                                            if (IsNullOrEmpty(accounts.roles))
                                                accounts.roles = [];
                                            SArray.add(accounts.roles, Roles.ADMIN);
                                        }
                                        const verifyCode = GenUUID();
                                        const expirationMinutes = config.metaverseServer.email_verification_timeout_minutes;
                                        const request : RequestInterface = {
                                            requestType: RequestType.VERIFYEMAIL,
                                            requestingAccountId: accounts.id,
                                            verificationCode:verifyCode,
                                            expirationTime: new Date(Date.now() + 1000 * 60 * expirationMinutes)
                                        };
                                        
                                        this.createData(config.dbCollections.requests,request);

                                        const verificationURL =
                                            config.metaverse.metaverseServerUrl +
                                            `/api/v1/account/verify/email?a=${accounts.id}&v=${verifyCode}`;
                                        const metaverseName =
                                            config.metaverse.metaverseName;
                                        const shortMetaverseName =
                                            config.metaverse.metaverseNickName;
                                        const verificationFile = path.join(
                                            __dirname,
                                            '../..',
                                            config.metaverseServer.email_verification_email_body
                                        );

                                        let emailBody = await fsPromises.readFile(
                                            verificationFile,
                                            'utf-8'
                                        );
                                        emailBody = emailBody
                                            .replace(
                                                'VERIFICATION_URL',
                                                verificationURL
                                            )
                                            .replace(
                                                'METAVERSE_NAME',
                                                metaverseName
                                            )
                                            .replace(
                                                'SHORT_METAVERSE_NAME',
                                                shortMetaverseName
                                            );

                                        const email = {
                                            from: 'khilan.odan@gmail.com',
                                            to: accounts.email,
                                            subject: `${shortMetaverseName} account verification`,
                                            html: emailBody,
                                        };
                                        await sendEmail(
                                            this.app,
                                            email
                                        );
                                    }

                                    return Promise.resolve(buildSimpleResponse({
                                        accountId: accounts.id,
                                        username: accounts.username,
                                        accountIsActive:
                                            accounts.accountIsActive,
                                        accountWaitingVerification:
                                            accounts.accountWaitingVerification,
                                    }));
                                } catch (error: any) {
                                    throw new Error(
                                        'Exception adding user: ' + error
                                    );
                                }
                            } else {
                                throw new Error(messages.common_messages_email_validation_error);
                            } 
                        } else {
                            throw new Error(messages.common_messages_could_not_create_account);
                        }
                    } else {
                        throw new Error(messages.common_messages_user_email_link_error);
                    }
                } else {
                    throw new Error(messages.common_messages_account_already_exists);
                }
            } else {
                throw new Error(messages.common_messages_badly_formed_username);
            }
        } else {
            throw new Error(messages.common_messages_badly_formed_request);
        }
    }

    /**
   * Returns the Users
   *
   * @remarks
   * This method is part of the get list of users 
   * Request Type - GET
   * End Point - API_URL/users?per_page=10&filter=friends&status=online ....
   * 
   * @param per_page - page size
   * @param page - page number
   * @param filter - Connections|friends|all
   * @param status - Online|domainId
   * @param asAdmin - true | false if logged in account is administrator, list all accounts. Value is optional.
   * @returns - Paginated users { data:{users:[{...},{...}]},current_page:1,per_page:10,total_pages:1,total_entries:5}
   * 
   */
    async find(params?: Params): Promise<any> {
        const loginUser = extractLoggedInUserFromParams(params);
        let asAdmin = params?.query?.asAdmin === 'true' ? true : false;
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page) || 1;
        const skip = ((page) - 1) * perPage;
        const filter = params?.query?.filter || '';
        const status = params?.query?.filter || '';
        const filterQuery: any = {};
        const targetAccount = params?.query?.account ?? '';

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

        const userData :any = await this.findData(config.dbCollections.accounts, {
            query: {
                ...filterQuery,
                accountIsActive: true,
                $skip: skip,
                $limit: perPage,
            },
        });

        const userList:AccountInterface[] = userData.data;  
                
        const users: Array<any> = [];
        (userList as Array<AccountInterface>)?.forEach(async (element) => {
            users.push(await buildUserInfo(element));
        });

        return Promise.resolve(buildPaginationResponse({ users },page,perPage,Math.ceil(userData.total/perPage),userData.total));
    }
}
