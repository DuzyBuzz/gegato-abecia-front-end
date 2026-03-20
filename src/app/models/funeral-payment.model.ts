export interface FuneralPayment {
  id?: number;
  
  // Payment Information
  controlNumber?: string;
  dateIssued?: Date | string;
  checkDate?: Date | string;
  issuedBy?: string;
  
  // Bank & Account Details
  bank?: string;
  accountNumber?: string;
  
  amount?: number | string;


  description?: string;
  remarks?: string;

  checkCleared?: boolean;
  
  // Reference to Funeral Service
  funeralServiceId?: number;
}
