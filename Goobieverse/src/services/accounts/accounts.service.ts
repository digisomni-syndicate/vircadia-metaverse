// Initializes the `accounts` service on path `/accounts`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Accounts } from './accounts.class'; 
import hooks from './accounts.hooks';
import config from '../../appconfig';
// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'accounts': Accounts & ServiceAddons<any>;
  }
}

function redirect(req:any, res:any): Promise<any> {
    try {
        const url = ((res.hook.result.message)?config.metaverseServer.email_verification_failure_redirect:config.metaverseServer.email_verification_success_redirect).replace('METAVERSE_SERVER_URL',config.metaverse.metaverseServerUrl).replace('FAILURE_REASON',res.hook?.result?.message);
        return res.redirect(url);
    } catch (err) {
        throw err;
    }
}

export default function (app: Application): void {
    const options = {
        paginate: app.get('paginate'),
        id:'id',
        multi:['remove']
    };

    // Initialize our service with any options it requires
    app.use('/accounts', new Accounts(options, app));
  
    app.use('/accounts/verify/email', app.service('accounts'),redirect);
    
    // Get our initialized service so that we can register hooks
    const service = app.service('accounts');
    service.hooks(hooks);
}
