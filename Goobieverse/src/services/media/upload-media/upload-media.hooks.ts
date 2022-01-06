import * as authentication from '@feathersjs/authentication';
import { disallow } from 'feathers-hooks-common';
//import { SYNC } from 'feathers-sync';
import { HooksObject } from '@feathersjs/feathers';
import addUriToFile from '../../../hooks/media/add-uri-to-file';
import attachOwnerIdInSavingContact from '../../../hooks/media/set-loggedin-user-in-body'; 
import makeS3FilesPublic from '../../../hooks/media/make-s3-files-public';
import reformatUploadResult from '../../../hooks/media/reformat-upload-result'; 
import requestSuccess from '../../../hooks/requestSuccess';

// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
    before: {
        all: [],
        find: [disallow()],
        get: [disallow()],
        create: [
            authenticate('jwt'),
            attachOwnerIdInSavingContact('userId'),
            addUriToFile(),
            makeS3FilesPublic(),
        ],
        update: [disallow()],
        patch: [disallow()],
        remove: [disallow()],
    },

    after: {
        all: [],
        find: [],
        get: [],
        create: [
            reformatUploadResult(),
            // removePreviousFile(),
            // createOwnedFile(),
            //(context) => (context[SYNC] = false),
            requestSuccess(),
        ],
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
