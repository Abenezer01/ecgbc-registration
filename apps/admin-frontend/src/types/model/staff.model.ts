import { Abstract } from "./abstract.model";
import { Role } from "./role.model";

export interface Staff extends Abstract {
    firstName: string;
    lastName: string;
    fullName: string;
    phoneNumber ?: string;
    email:string
    avatar ?:string
    role:Role
}

export interface NewStaff {
    firstName: string;
    lastName: string;
    phoneNumber : string;
    email:string
    password:string
    avatar :string | File
    roleId?:string
    stateId?:string 
}