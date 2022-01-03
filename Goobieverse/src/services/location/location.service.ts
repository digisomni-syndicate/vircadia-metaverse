// Initializes the `location` service on path `/location`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Location } from './location.class';
import hooks from './location.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'location': Location & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
    const options = {
        paginate: app.get('paginate'),
        id:'id'
    };

    // Initialize our service with any options it requires
    app.use('/location', new Location(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.service('location');

    service.hooks(hooks);
}
