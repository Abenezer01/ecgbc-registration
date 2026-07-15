import { Abstract } from "./abstract.model";

export interface IFile extends Abstract {
  file: string;
  fileName: string;
}

export interface NewFile {
  fileName: string;
  memberId?: string;
  file: string | File;
}
export interface NewFiles {
  files: File[]; // Changed from 'file: string | File' to 'files: File[]'
  memberId: string;
}
