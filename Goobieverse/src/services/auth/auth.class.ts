import { DatabaseServiceOptions } from '../../dbservice/DatabaseServiceOptions';
import { DatabaseService } from '../../dbservice/DatabaseService';
import { Application } from '../../declarations'; 
import config from '../../appconfig';
export class Auth extends DatabaseService {
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
        this.getService(config.dbCollections.accounts);
    }
}
