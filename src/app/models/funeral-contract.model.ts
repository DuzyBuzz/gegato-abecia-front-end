

export interface FuneralContract {
  contract_id: number;

  header: ContractHeader;
  deceased: Deceased;
  contractee: Contractee;

  casket_urn: CasketUrn;

  delivery: DeliveryInfo;
  transfer: TransferInfo;
  burial_schedule: BurialSchedule;

  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ON-HOLD' | 'DRAFT' | 'PENDING';

  remarks: ContractRemarks;

  created_at?: string;
  updated_at?: string;
}
export interface ContractHeader {
  contract_date: string; // ISO
  contract_no: string;

  type_of_service: string;
  type_of_cremation: string;
  financial_assistance: string;
}
export interface Deceased {
  id: number;
  contract_no: string;

  first_name: string;
  middle_name: string;
  last_name: string;
  suffix?: string;

  date_of_birth?: string; // ISO date string
  age?: number;
  sex?: string; // Male, Female
  civil_status?: string; // Single, Married, Widowed, Widower, Divorced

  religion: string;

  type_of_service: string;
  type_of_interment: string;
  casket: string;

  date_of_death: string; // ISO date string
  address_of_deceased?: string;
  place_of_death?: string;

  retrived_date: string; // ISO date string
  office: string;
  deliviered_by: string;
  informant?: string; // Person who provided the information
}

export interface Contractee {
  full_name: string;
  age: number;

  occupation: string;

  address: string;
  barangay: string;
  district: string;
  city: string;

  relationship: string;

  contact_no: string;
  email: string;

  plan: string;
  plan_no: string;

  referred_by: string;
}
export interface CasketUrn {
  contract_price: number;

  casket_type: string;
  casket_description: string;
  casket_other_details: string;

  urn_type: string;
  urn_description: string;
}
export interface DeliveryInfo {
  date: string; // ISO
  time: string; // HH:mm

  location: string;

  driver: string;
  helper: string;
  vehicle: string;
}
export interface TransferInfo {
  date: string; // ISO
  time: string; // HH:mm

  location: string;
  notes: string;
}

export interface BurialSchedule {
  burial_date: string; // ISO
  take_off_time: string; // HH:mm
  mass_time: string; // HH:mm

  holding_area: string;

  cremation_date: string; // ISO
  cremation_time: string; // HH:mm

  church: string;
  cemetery: string;

  notes: string;

  driver: string;
  helper: string;
  vehicle: string;
}
export interface ContractRemarks {
  contract: string;
  operations: string;
  morgue: string;
}
