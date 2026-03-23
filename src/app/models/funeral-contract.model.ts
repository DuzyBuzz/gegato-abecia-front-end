export interface FuneralContract {
  id?: number;

  // Contract Info
  contractNo?: string;
  contractDate?: Date | string;
  type?: string;
  price?: number | string;
  discount?: number | string;
  dueDate?: Date | string;
  checkedBy?: string;

  // Deceased Information
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  age?: number | string;
  gender?: string;
  civilStatus?: string;
  dateOfDeath?: Date | string;
  timeOfDeath?: string;
  placeOfDeath?: string;
  placeOfBirth?: string;
  religion?: string;
  addressLine1?: string;
  parentFather?: string;
  parentMother?: string;

  // Contractee Information
  contractee?: string;
  contracteeAge?: number | string;
  contracteeGender?: string;
  contracteeCivilStatus?: string;
  baranggay?: string;
  district?: string;
  municipality?: string;
  province?: string;
  contactNo?: string;
  nameOfInformant?: string;
  plan?: string;
  planNumber?: string;
  relationshipToDeceased?: string;

  // Casket/Urn
  casket?: string;
  casketAvailable?: string;
  uniform?: string;
  urnType?: string;
  urnDescription?: string;

  // Delivery
  deliverySerialNumber?: string;
  deliveryHelper?: string;
  deliveryRemarks?: string;
  deliveryStatus?: string;
  deliveryDate?: Date | string;


  // Transfer
  transferAddress?: string;
  transferTime?: string;
  dateOfTransfer?: Date | string;
  dateReceived?: Date | string;

  // Burial/Cremation
  dateOfBurial?: Date | string;
  takeOff?: string;
  massTime?: string;
  burialDriver?: string;
  burialHelper?: string;
  familyCar?: string;
  familyCarDriver?: string;
  flowerCar?: string;
  flowerCarDriver?: string;
  carRental?: string;
  carRentalDriver?: string;
  setupCrew?: string;
  cremationTime?: string;
  cremationOperator?: string;
  burialBenefit?: string;
  pallBearrer?: string;
  funeralDirector?: string;

  // Embalming & Makeup
  dateEmblamed?: Date | string;
  timeFinished?: string;
  makeupDressUp?: string;
  makeUprequest?: string;
  bodySpecialInstruction?: string;
  nails?: string;
  lips?: string;
  embalmers?: string;
  finishedBy?: string;
  embalmedBy?: string;

  // Medical
  autopsy?: string;
  autopsyDate?: Date | string;
  autopsyBy?: string;

  // Identification Documents
  idType?: string;
  claimIdNumber?: string;
  seniorId?: string;
  issuedAt?: string;
  issuedOn?: Date | string;

  // Barangay/Government
  baranggayIndigent?: string;
  baranggayCaptain?: string;
  cityDocsCompletion?: boolean;

  // Signatures
  supSigBurial?: string;
  omSigDelivery?: string;
  omSigBurial?: string;
  chapelRental?: string;

  // Remarks & Status
  remarks?: string;
  billingRemarks?: string;
  familyWillConvo?: boolean;
  cleared?: boolean;
  collectorRemarks?: boolean;

  // Dates & Timestamps
  startOfTransaction?: Date | string;
  dateSubmitted?: Date | string;
  timeEncoded?: Date | string;
  dateAshReleased?: Date | string;
  releasedBy?: string;
  receivedBy?: string;

  // Financial Assistance
  financialAssitance?: string;
}