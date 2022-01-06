import { Params } from '@feathersjs/feathers';
import { Application } from '../../../declarations';
import { DatabaseService } from '../../../common/dbservice/DatabaseService';
import { DatabaseServiceOptions } from '../../../common/dbservice/DatabaseServiceOptions';
import config from '../../../appConfig';
/**
 * A class for Static Resource  service
 *
 */
export class StaticResource extends DatabaseService {
    public docs: any;

    constructor(options: Partial<DatabaseServiceOptions>, app: Application) {
        super(options,app);
    }

    async create(data:any, params?: Params): Promise<any> {
         
        const oldResource = await this.findDataToArray(config.dbCollections.asset,{
            query: {
                $select: ['id'],
                url: data.url,
            },
        });

        if ((oldResource as any).total > 0) {
            return this.patchMultipleData(config.dbCollections.asset,null,data, {query:{ url: data.url }});
        } else {
            return this.createData(config.dbCollections.asset,data);
        }
    }

    async find(params: Params): Promise<any> {
        if (params.query?.getAvatarThumbnails === true) {
            delete params.query.getAvatarThumbnails;
            const result = await this.findData(config.dbCollections.asset,params);
            for (const item of result.data) {
                const dataList = await this.findDataToArray(config.dbCollections.asset,{query: {name: item.name,staticResourceType: 'user-thumbnail'}});  
                if(dataList.length >0){
                    item.thumbnail = dataList[0];
                }
            }
            return result;
        } else {
            return await this.findData(config.dbCollections.asset,params);
        }
    }
}
