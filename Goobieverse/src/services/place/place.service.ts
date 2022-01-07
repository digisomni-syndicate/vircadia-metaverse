// Initializes the `place` service on path `/place`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Place } from './place.class';
import hooks from './place.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'place': Place & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
    const options = {
        paginate: app.get('paginate'),
        id:'id'
    };

    // Initialize our service with any options it requires
    app.use('/place', new Place(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.service('place');

    service.hooks(hooks);
}
