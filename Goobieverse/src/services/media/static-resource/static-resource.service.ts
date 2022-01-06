import { Application } from '../../../declarations';
import { StaticResource } from './static-resource.class';
import hooks from './static-resource.hooks';
import { ServiceAddons } from '@feathersjs/feathers';

declare module '../../../declarations' {
    interface ServiceTypes {
        'static-resource': StaticResource & ServiceAddons<any>;
    }
}

export default (app: Application) => {
    const options = {
        paginate: app.get('paginate'),
        id:'id',
        multi: true,
    };

    /**
     * Initialize our service with any options it requires and docs
     *
     */
    const event = new StaticResource(options, app);

    app.use('static-resource', event);

    /**
     * Get our initialized service so that we can register hooks
     *
     */
    const service = app.service('static-resource');

    service.hooks(hooks);
};
