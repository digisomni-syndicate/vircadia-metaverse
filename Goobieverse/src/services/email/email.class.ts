import { DatabaseService } from '../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../common/dbservice/DatabaseServiceOptions';
import { Application } from '../../declarations';
export class Email extends DatabaseService {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
    }
}
