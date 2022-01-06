'use strict';

interface Inventory{
    id:string;
    itemId:string;
    qty:number;
    userId:string;
}

interface InventoryItem{
    id:string;
    name:string;
    description:string;
    metaData:string;
    thumbnail:string;
    url:string;
    isNFT:boolean;
    isTransferable:boolean;
}
