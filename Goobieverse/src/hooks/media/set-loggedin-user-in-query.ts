import { HookContext } from '@feathersjs/feathers';
import { extractLoggedInUserFromParams } from '../../services/auth/auth.utils';

// TODO: Make one hook by combine this with "set-loggedin-user-in-body"
// This will attach the loggedIn user id in the query property
export default (propertyName: string) => {
    return (context: HookContext): any => {
        
        const loggedInUser = extractLoggedInUserFromParams(context.params);
        context.params.query = {
            ...context.params.query,
            [propertyName]: loggedInUser?.id || null,
        };

        return context;
    };
};
