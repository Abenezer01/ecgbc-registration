import { Abstract } from "./abstract.model";
import { DataLookup } from "./data-lookup.model";
import { Permission } from "./permssion.model";

export interface Role extends Abstract {
    name: string;
    description: string;
    type:DataLookup
    typeId:string
    state:DataLookup
    permissions:Permission[]
}

export interface NewRole {
    name: string;
    description: string;
    permissions:string[]
}
