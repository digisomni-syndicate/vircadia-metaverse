import { HooksObject } from '@feathersjs/feathers';
import requestSuccess from '../../hooks/requestSuccess';
import requestFail from '../../hooks/requestFail';
import { disallow } from 'feathers-hooks-common';

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [disallow()],
        create: [],
        update: [disallow()],
        patch: [disallow()],
        remove: [disallow()]
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
