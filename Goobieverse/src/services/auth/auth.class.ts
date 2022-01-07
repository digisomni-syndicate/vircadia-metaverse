import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { DatabaseService } from '../../common/dbservice/DatabaseService';

import { Application } from '../../declarations'; 
import config from '../../appConfig';
export class Auth extends DatabaseService {
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
        this.getService(config.dbCollections.accounts);
    }
}
