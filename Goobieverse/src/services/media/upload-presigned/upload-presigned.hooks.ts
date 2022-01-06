import { HooksObject } from '@feathersjs/feathers';
import { disallow } from 'feathers-hooks-common';
import * as authentication from '@feathersjs/authentication';


import reformatUploadResult from '../../../hooks/media/reformat-upload-result';
import uploadThumbnail from '../../../hooks/media/upload-thumbnail';
import createResource from '../../../hooks/media/create-static-resource';
import { validateGet,checkDefaultResources} from '../../../hooks/media/validatePresignedRequest';
import userPermission from '../../../hooks/userPermission';
import { Perm } from '../../../utils/Perm';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [authenticate('jwt'), validateGet],
        create: [disallow()],
        update: [disallow()],
        patch: [disallow()],
        remove: [
            authenticate('jwt'),
            userPermission([Perm.ADMIN]),
            checkDefaultResources,
        ],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [reformatUploadResult(), createResource(), uploadThumbnail()],
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
