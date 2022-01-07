import { HooksObject } from '@feathersjs/feathers';
import * as feathersAuthentication from '@feathersjs/authentication';
const { authenticate } = feathersAuthentication.hooks;
import  requestFail  from '../../hooks/requestFail';
import requestSuccess from '../../hooks/requestSuccess';
import checkAccessToAccount from '../../hooks/checkAccess';
import config from '../../appconfig';
import { Perm } from '../../utils/Perm';
import { disallow, iff } from 'feathers-hooks-common';
import isHasAuthToken from '../../hooks/isHasAuthToken';

export default {
    before: {
        all: [],
        find: [],
        get: [iff(isHasAuthToken(),authenticate('jwt')),checkAccessToAccount(config.dbCollections.accounts,[Perm.DOMAINACCESS,Perm.ADMIN])],
        create: [iff(isHasAuthToken(),authenticate('jwt')),checkAccessToAccount(config.dbCollections.accounts,[Perm.PUBLIC,Perm.OWNER,Perm.ADMIN])],
        update: [iff(isHasAuthToken(),authenticate('jwt')),checkAccessToAccount(config.dbCollections.accounts,[ Perm.DOMAINACCESS, Perm.ADMIN ])],
        patch: [disallow()],
        remove: [iff(isHasAuthToken(),authenticate('jwt')),checkAccessToAccount(config.dbCollections.accounts,[ Perm.DOMAINACCESS, Perm.ADMIN ])]
    },

    after: {
        all: [requestSuccess()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    },

    error: {
        all: [requestFail()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: []
    }
} as HooksObject;
