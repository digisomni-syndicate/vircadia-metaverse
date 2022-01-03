// Initializes the `domains` service on path `/domains`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Domains } from './domains.class';
import hooks from './domains.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'domains': Domains & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
    const options = {
        paginate: app.get('paginate')
    };

    // Initialize our service with any options it requires
    app.use('/domains', new Domains(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.service('domains');

    service.hooks(hooks);
}
