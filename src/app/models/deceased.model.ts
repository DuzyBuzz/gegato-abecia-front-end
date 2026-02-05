export interface Deceased {
  id: number;
  contract_no: string;

  first_name: string;
  middle_name: string;
  last_name: string;

  religion: string;

  type_of_service: string;
  type_of_interment: string;
  casket: string;

  date_of_death: string; // ISO date string

  retrived_date: string; // ISO date string
  office: string;
  deliviered_by: string;


}