import { RequestType } from './../../utils/sets/RequestType';
import { DatabaseService } from './../../dbservice/DatabaseService';
import { DatabaseServiceOptions } from './../../dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
import config from '../../appconfig';
import { Params } from '@feathersjs/feathers';
import { AccountModel } from '../../interfaces/AccountModel';
import { GenUUID } from '../../utils/Misc';
import { Roles } from '../../utils/sets/Roles';
import { IsNullOrEmpty, isValidObject } from '../../utils/Misc';
import { SArray } from '../../utils/vTypes';
import { sendEmail } from '../../utils/mail';
import path from 'path';
import fsPromises from 'fs/promises';
import { buildUserInfo } from '../../responsebuilder/accountsBuilder';
import { RequestModel } from '../../interfaces/RequestModel';
import { buildSimpleResponse, buildPaginationResponse } from '../../responsebuilder/responseBuilder';
import { messages } from '../../utils/messages';
export class Users extends DatabaseService {
    app: Application;
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options, app);
        this.app = app;
    }

    async create(data: AccountModel): Promise<any> {
        if (data.username && data.email && data.password) {
            const username: string = data.username;
            const email: string = data.email;
            if (username) {
                const accountsName: AccountModel[] = await this.findDataToArray(
                    config.dbCollections.accounts,
                    { query: { username: username } }
                );
                const name = (accountsName as Array<AccountModel>)?.map(
                    (item) => item.username
                );
                if (!name.includes(username)) {
                    const accountsEmail: AccountModel[] =
                        await this.findDataToArray(
                            config.dbCollections.accounts,
                            { query: { email: email } }
                        );
                    const emailAddress = (
                        accountsEmail as Array<AccountModel>
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
                                ...data,
                                id: id,
                                roles: roles,
                                whenCreated: whenCreated,
                                friends: friends,
                                connections: connections,
                                accountIsActive: accountIsActive,
                                accountWaitingVerification:
                                    accountWaitingVerification,
                            }
                        );
                        if (isValidObject(accounts)) {
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
                                        const request : RequestModel = {
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

    async find(params?: Params): Promise<any> {
        const perPage = parseInt(params?.query?.per_page) || 10;
        const page = parseInt(params?.query?.page) || 1;
        const skip = ((page) - 1) * perPage;

        const userData :any = await this.findData(config.dbCollections.accounts, {
            query: {
                accountIsActive: true,
                $skip: skip,
                $limit: perPage,
            },
        });

        const userList:AccountModel[] = userData.data;  
                
        const user: Array<any> = [];
        (userList as Array<AccountModel>)?.forEach(async (element) => {
            user.push(await buildUserInfo(element));
        });

        return Promise.resolve(buildPaginationResponse({ user },page,perPage,Math.ceil(userData.total/perPage),userData.total));
    }
}
