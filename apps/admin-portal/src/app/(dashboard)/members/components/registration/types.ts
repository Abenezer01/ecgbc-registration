/**
 * Shared types for all registration form section components.
 * Keeps sections decoupled — each receives only the slice it needs.
 */

export type BoardMember = {
  id: string;
  fullName: string;
  fullNameEn: string;
  phoneNumber: string;
  titleId: string;
};

export type RegistrationFormState = {
  name: string;
  nameEn: string;
  certificateNo: string;
  councilFellowshipId: string;
  typeId: string;
  stateId: string;
  isInEthiopia: boolean;
  certificateIssuedDate: string;
  country: string;
  regionId: string;
  city: string;
  subcity: string;
  zone: string;
  district: string;
  houseNumber: string;
  poBoxNumber: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  boardMembers: BoardMember[];
  contactPersonFullName: string;
  contactPersonPhoneNumber: string;
  contactPersonEmail: string;
};

export const INITIAL_FORM: RegistrationFormState = {
  name: "", nameEn: "", certificateNo: "", councilFellowshipId: "",
  typeId: "", stateId: "", isInEthiopia: true, certificateIssuedDate: "",
  country: "", regionId: "", city: "", subcity: "", zone: "", district: "",
  houseNumber: "", poBoxNumber: "", phoneNumber: "", email: "", isActive: true,
  boardMembers: [],
  contactPersonFullName: "", contactPersonPhoneNumber: "", contactPersonEmail: "",
};

export type DataLookup = {
  id: string;
  type: string;
  value: string;
  description: string;
  note?: string;
  isRequired?: boolean;
};
