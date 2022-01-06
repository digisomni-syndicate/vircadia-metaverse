import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import { UploadPresigned } from './upload-presigned.class';
import hooks from './upload-presigned.hooks';

declare module '../../../declarations' {
    interface ServiceTypes {
        'upload-presigned': UploadPresigned & ServiceAddons<any>;
    }
}

export default (app: Application): void => {
    const presigned = new UploadPresigned({id:'id'}, app);

    app.use('upload-presigned', presigned);

    const service = app.service('upload-presigned');

    service.hooks(hooks);
};
