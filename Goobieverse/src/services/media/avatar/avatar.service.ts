import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import { Avatar } from './avatar.class';
import hooks from './avatar.hooks';

declare module '../../../declarations' {
  /**
   * Interface for users input
   */
  interface ServiceTypes {
    avatar: Avatar & ServiceAddons<any>
  }
}

export default (app: Application): void => {
    const options = {
        paginate: app.get('paginate'),
        id:'id',
        multi: true
    };

    const event = new Avatar(options, app);

    app.use('avatar', event);

    const service = app.service('avatar');

    service.hooks(hooks);
};
