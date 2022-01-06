// Initializes the `current` service on path `/current`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Current } from './current.class';
import hooks from './current.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'current': Current & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
    const options = {
        paginate: app.get('paginate'),
        id:'id'
    };

    // Initialize our service with any options it requires
    app.use('/current', new Current(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.service('current');

    service.hooks(hooks);
}
