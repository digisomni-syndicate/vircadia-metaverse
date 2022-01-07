import { Service, } from 'feathers-mongodb';
import { Application } from '../../declarations';
import { HookContext, Paginated, Id,NullableId } from '@feathersjs/feathers';
import { DatabaseServiceOptions } from './DatabaseServiceOptions';
import { Db, Collection, Document, Filter } from 'mongodb';
import { IsNotNullOrEmpty, IsNullOrEmpty } from '../../utils/Misc';
import { VKeyedCollection } from '../../utils/vTypes';
import { messages } from '../../utils/messages';

export class DatabaseService extends Service {
    app?: Application;
    db?: Db;
    context?: HookContext;
    constructor(
        options: Partial<DatabaseServiceOptions>,
        app?: Application,
        context?: HookContext
    ) {
        super(options);
        this.app = app;
        this.context = context;
        this.loadDatabase();
    }

    async loadDatabase() {
        if (IsNotNullOrEmpty(this.app) && this.app) {
            this.db = await this.app.get('mongoClient');
        } else if (IsNotNullOrEmpty(this.context) && this.context) {
            this.db = await this.context.app.get('mongoClient');
        }
    }

    async getDatabase(): Promise<Db> {
        if (IsNullOrEmpty(this.db)) {
            await this.loadDatabase();
        }
        if (this.db) {
            return this.db;
        }
        throw new Error(messages.common_messages_error);
    }

    async getService(tableName: string): Promise<Collection<Document>> {
        this.Model = await (await this.getDatabase()).collection(tableName);
        return this.Model;
    }

    async getData(tableName: string, id: Id): Promise<any> {
        await this.getService(tableName);
        return super.get(id);
    }

    async findData(
        tableName: string,
        filter?: Filter<any>
    ): Promise<Paginated<any>> {
        await this.getService(tableName);
        if (filter) {
            return await super.find(filter) as Paginated<any>;
        } else {
            return await super.find() as Paginated<any>;
        }
    }

    async findDataToArray(
        tableName: string,
        filter?: Filter<any>
    ): Promise<any[]> {
        await this.getService(tableName);
        const data = await this.findData(tableName, filter);
        if (data instanceof Array) {
            return data;
        } else {
            return data.data;
        }
    }

    async patchData(
        tableName: string,
        id: Id,
        data: VKeyedCollection
    ): Promise<any> {
        await this.getService(tableName);
        return await super.patch(id, data);
    }

    async patchMultipleData(
        tableName: string,
        id: NullableId,
        data: VKeyedCollection,
        filter: Filter<any>
    ): Promise<any> {
        await this.getService(tableName);
        return await super.patch(id, data,filter);
    }

    async deleteData(
        tableName: string,
        id: Id,
        filter?: Filter<any>
    ): Promise<any> {
        await this.getService(tableName);
        return await super.remove(id, filter);
    }

    async deleteMultipleData(tableName:string,filter:Filter<any>): Promise<any> {
        await (this.getService(tableName));
        return await super.remove(null,filter);
    }

    async createData(tableName: string, data: any): Promise<any> {
        await this.getService(tableName);
        return await super.create(data);
    }
}