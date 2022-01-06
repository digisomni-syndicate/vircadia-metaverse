import { HookContext, HooksObject } from '@feathersjs/feathers';
import { hooks } from '@feathersjs/authentication';
import dauria from 'dauria';
import replaceThumbnailLink from '../../../hooks/media/replace-thumbnail-link';
import attachOwnerIdInQuery from '../../../hooks/media/set-loggedin-user-in-query';
import { Perm } from '../../../utils/Perm';

import userPermission from '../../../hooks/userPermission';

const { authenticate } = hooks;

export default {
    before: {
        all: [],
        find: [],
        get: [],
        create: [
            authenticate('jwt'),
            userPermission([Perm.ADMIN]),
            (context: HookContext): HookContext => {
                if (!context.data.uri && context.params.file) {
                    const file = context.params.file;
                    const uri = dauria.getBase64DataURI(
                        file.buffer,
                        file.mimetype
                    );

                    const mimeType = context.data.mimeType ?? file.mimetype;
                    //console.log('mimeType is', file.mimetype);
                    const name = context.data.name ?? file.name;
                    context.data = { uri: uri, mimeType: mimeType, name: name };
                }
                return context;
            },
        ],
        update: [authenticate('jwt'), userPermission([Perm.ADMIN])],
        patch: [
            authenticate('jwt'),
            userPermission([Perm.ADMIN]),
            replaceThumbnailLink(),
        ],
        remove: [
            authenticate('jwt'),
            userPermission([Perm.ADMIN]),
            attachOwnerIdInQuery('userId'),
        ],
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
