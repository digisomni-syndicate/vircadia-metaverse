import { HooksObject } from '@feathersjs/feathers';
import { disallow } from 'feathers-hooks-common';


export default {
    before: {
        all: [],
        find: [disallow('external')],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
} as HooksObject;
