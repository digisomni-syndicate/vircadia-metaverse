import { DomainInterface } from '../interfaces/DomainInterface';
import { AccountInterface } from '../interfaces/AccountInterface';
import { buildLocationInfo } from './placesBuilder';
import { VKeyedCollection } from '../../utils/vTypes';
import { isAdmin, isEnabled, createSimplifiedPublicKey } from '../../utils/Utils';
// Return the limited "user" info.. used by /api/v1/users
export async function buildUserInfo(pAccount: AccountInterface,domain?:DomainInterface): Promise<any> {
    return {
        accountId: pAccount.id,
        id: pAccount.id,
        username: pAccount.username,
        images: await buildImageInfo(pAccount),
        location: await buildLocationInfo(pAccount,domain),
    };
}

export async function buildImageInfo(pAccount: AccountInterface): Promise<any> {
    const ret: VKeyedCollection = {};

    if (pAccount.imagesTiny) ret.tiny = pAccount.imagesTiny;
    if (pAccount.imagesHero) ret.hero = pAccount.imagesHero;
    if (pAccount.imagesThumbnail) ret.thumbnail = pAccount.imagesThumbnail;
    return ret;
}

// Return the block of account information.
// Used by several of the requests to return the complete account information.
export async function buildAccountInfo(
    pAccount: AccountInterface,
    domain?:DomainInterface
): Promise<any> {
    return {
        accountId: pAccount.id,
        id: pAccount.id,
        username: pAccount.username,
        email: pAccount.email,
        administrator: isAdmin(pAccount),
        enabled: isEnabled(pAccount),
        roles: pAccount.roles,
        availability: pAccount.availability,
        public_key: createSimplifiedPublicKey(pAccount.sessionPublicKey),
        images: {
            hero: pAccount.imagesHero,
            tiny: pAccount.imagesTiny,
            thumbnail: pAccount.imagesThumbnail,
        },
        profile_detail: pAccount.profileDetail,
        location: await buildLocationInfo(pAccount,domain),
        friends: pAccount.friends,
        connections: pAccount.connections,
        when_account_created: pAccount.whenCreated?.toISOString(),
        when_account_created_s: pAccount.whenCreated?.getTime().toString(),
        time_of_last_heartbeat: pAccount.timeOfLastHeartbeat?.toISOString(),
        time_of_last_heartbeat_s: pAccount.timeOfLastHeartbeat?.getTime().toString(),
    };
}

// Return the block of account information used as the account 'profile'.
// Anyone can fetch a profile (if 'availability' is 'any') so not all info is returned
export async function buildAccountProfile(
    pAccount: AccountInterface,
    aDomain?: DomainInterface
): Promise<any> {
    return {
        accountId: pAccount.id,
        id: pAccount.id,
        username: pAccount.username,
        images: {
            hero: pAccount.imagesHero,
            tiny: pAccount.imagesTiny,
            thumbnail: pAccount.imagesThumbnail,
        },
        profile_detail: pAccount.profileDetail,
        location: await buildLocationInfo(pAccount, aDomain),
        when_account_created: pAccount.whenCreated?.toISOString(),
        when_account_created_s: pAccount.whenCreated?.getTime().toString(),
        time_of_last_heartbeat: pAccount.timeOfLastHeartbeat?.toISOString(),
        time_of_last_heartbeat_s: pAccount.timeOfLastHeartbeat?.getTime().toString(),
    };
}