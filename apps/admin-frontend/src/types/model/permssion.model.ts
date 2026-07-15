import { Abstract } from "./abstract.model";

export interface Permission extends Abstract {
    codeName:string;
    description:string;
}