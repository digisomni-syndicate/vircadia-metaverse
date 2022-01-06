import { Params } from '@feathersjs/feathers';
import config from '../../appConfig'; 
/**
 * This method will extract the loggedIn User from params
 *
 * @param params
 * @returns extracted user
 */

export const extractLoggedInUserFromParams = (params?: Params): any => {
    if(params){
        return params[config.authentication.entity];
    }else{
        return null;
    }
};
