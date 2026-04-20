export interface ContractCharges {
  id?: number;
  
  funeralContractId?: number | null;
  chargeType?: string | null; 
  description?: string | null; // flowers, transportation, etc.
  quantity?: number | null;
  unitPrice?: number | null;
  discount?: number | null; // amount


  createdAt?: string | null;
  createdOn?: string | null;


  createdBy?: string | null;
  updatedBy?: string | null; // billed by


}
  