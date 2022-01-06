import { AVATAR_FILE_ALLOWED_EXTENSIONS, MIN_AVATAR_FILE_SIZE, MAX_AVATAR_FILE_SIZE, MIN_THUMBNAIL_FILE_SIZE, MAX_THUMBNAIL_FILE_SIZE } from '../../utils/constants';
import { HookContext } from '@feathersjs/feathers';
import { messages } from '../../utils/messages';

export const validateGet = async ( context: HookContext): Promise<HookContext> => {
    const query = context.params.query;
    if(query){
        switch (query.type) {
        case 'user-thumbnail':
            if (query.fileSize < MIN_THUMBNAIL_FILE_SIZE || query.fileSize > MAX_THUMBNAIL_FILE_SIZE)
                throw new Error(messages.common_messages_thumbnail_size_exceeded);
            break;
        case 'avatar':
            if ( query.fileSize < MIN_AVATAR_FILE_SIZE || query.fileSize > MAX_AVATAR_FILE_SIZE)
                throw new Error(messages.common_messages_avatar_size_exceeded);
    
            const allowedExtenstions = AVATAR_FILE_ALLOWED_EXTENSIONS.split(',');
            if ( !allowedExtenstions.includes(query.fileName.substring(query.fileName.lastIndexOf('.'))))
                throw new Error(messages.common_messages_avatar_invalid_file_type);
            break;
        default:
            break;
        }
    }
    return context;
};

export const checkDefaultResources = async (context: HookContext): Promise<HookContext> => {
    const q = context.params?.query?.keys || [];

    const defaultResources = await context.app.service('static-resource').find({
        query: {
            key: {
                $in: q,
            },
            userId: null,
        },
    },context.params);

    if (defaultResources.total > 0)
        throw new Error('Default resources can\'t be deleted.');
    return context;
};
