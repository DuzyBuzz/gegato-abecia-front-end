export interface FuneralPayment {
  id?: number;
  
  // Payment Information
  controlNumber?: string | null;
  dateIssued?: Date | string | null;
  checkDate?: Date | string | null;
  issuedBy?: string | null;
  paymentType?: string | null;
  orNumber?: string | null;
  arNumber?: string | null;
  
  // Account Details
  accountNumber?: string | null;
  
  amount?: number | string | null;


  description?: string | null;
  remarks?: string | null;

  checkCleared?: boolean | null;
  
  // Reference to Funeral Service
  funeralServiceId?: number | null;
}
