import { HooksObject } from '@feathersjs/feathers';
import * as feathersAuthentication from '@feathersjs/authentication';
const { authenticate } = feathersAuthentication.hooks;
import requestSuccess from '../../hooks/requestSuccess';
import  requestFail  from '../../hooks/requestFail';
import checkAccessToAccount from '../../hooks/checkAccess';
import config from '../../appconfig';
import { Perm } from '../../utils/Perm';

export default {
    before: {
        all: [authenticate('jwt')],
        find: [],
        get: [],
        create: [],
        update: [checkAccessToAccount(config.dbCollections.domains,[Perm.MANAGER,Perm.ADMIN])],
        patch: [checkAccessToAccount(config.dbCollections.domains,[Perm.MANAGER,Perm.ADMIN])],
        remove: [checkAccessToAccount(config.dbCollections.domains,[Perm.SPONSOR,Perm.ADMIN])],
    },

    after: {
        all: [requestSuccess()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [requestFail()],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
