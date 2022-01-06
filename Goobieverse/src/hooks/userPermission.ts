import { HookContext } from '@feathersjs/feathers'; 
import { Perm } from '../utils/Perm'; 
import { HTTPStatusCode } from '../utils/response'; 
import { messages } from '../utils/messages';
import { extractLoggedInUserFromParams } from '../services/auth/auth.utils';


export default (userPermissions: Perm[]) => {
    return async (context: HookContext): Promise<HookContext> => {
        let canAccess = false;       
        const loginUser = extractLoggedInUserFromParams(context.params);
        if(loginUser?.roles){
            const roles = loginUser.roles as Array<any>;
            userPermissions.map(item=>{
                if(roles.includes(item)){
                    canAccess = true;
                }
            });            
        }


        if (!canAccess) {
            context.statusCode = HTTPStatusCode.Unauthorized;
            throw new Error(messages.common_messages_unauthorized);
        }

        return context;
    };
};
