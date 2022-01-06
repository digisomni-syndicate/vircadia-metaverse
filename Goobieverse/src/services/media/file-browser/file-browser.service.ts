import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import { FileBrowserService } from './file-browser.class';
import hooks from './file-browser.hooks';

declare module '../../../declarations' {
    interface ServiceTypes {
        'file-browser': FileBrowserService & ServiceAddons<any>;
    }
}

export default (app: Application): void => {
    const options = {
        paginate: app.get('paginate'),
        id:'id'
    };

    // Initialize our service with any options it requires and docs
    app.use('file-browser', new FileBrowserService(options,app));

    
    // Get our initialized service so that we can register hooks
    const service = app.service('file-browser');

    service.hooks(hooks);
};
