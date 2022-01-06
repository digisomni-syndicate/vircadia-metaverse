import { HooksObject } from '@feathersjs/feathers';
import * as authentication from '@feathersjs/authentication';
import { disallow } from 'feathers-hooks-common';
import attachOwnerIdInSavingContact from '../../../hooks/media/set-loggedin-user-in-body';
import addUriToFile from '../../../hooks/media/add-uri-to-file';


// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [],
        create: [
            authenticate('jwt'),
            attachOwnerIdInSavingContact('userId'),
            addUriToFile(),
        ],
        update: [disallow()],
        patch: [disallow()],
        remove: [disallow()],
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
