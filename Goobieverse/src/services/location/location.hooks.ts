import { HooksObject } from '@feathersjs/feathers';
import * as feathersAuthentication from '@feathersjs/authentication';
const { authenticate } = feathersAuthentication.hooks;
import  requestFail  from '../../hooks/requestFail';
import requestSuccess from '../../hooks/requestSuccess';
import { disallow } from 'feathers-hooks-common';

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [disallow()],
        update: [authenticate('jwt')],
        patch: [disallow()],
        remove: []
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
