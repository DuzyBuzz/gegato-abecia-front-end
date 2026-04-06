export interface FuneralContract {
  id?: number;

  // ========== SECTION 1: CONTRACT INFORMATION ==========
  contractNo?: string;
  contractDate?: string | null;
  type?: string;
  financialAssitance?: string | null;
  price?: number | null;
  discount?: number | null;
  dueDate?: string | null;
  checkedBy?: string | null;

  // ========== SECTION 2: DECEASED INFORMATION ==========
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  gender?: string | null;
  civilStatus?: string | null;
  dateOfDeath?: string | null;
  timeOfDeath?: string | null;
  placeOfDeath?: string | null;
  placeOfBirth?: string | null;
  religion?: string | null;
  addressLine1?: string | null;
  parentFather?: string | null;
  parentMother?: string | null;

  // ========== SECTION 3: CONTRACTEE INFORMATION ==========
  contractee?: string | null;
  contracteeAge?: number | null;
  contracteeGender?: string | null;
  contracteeCivilStatus?: string | null;
  baranggay?: string | null;
  district?: string | null;
  municipality?: string | null;
  province?: string | null;
  contactNo?: string | null;
  nameOfInformant?: string | null;
  plan?: string | null;
  planNumber?: string | null;
  relationshipToDeceased?: string | null;

  // ========== SECTION 4: CASKET / URN ==========
  casket?: string | null;
  casketAvailable?: string | null;
  uniform?: string | null;
  urnType?: string | null;
  urnDescription?: string | null;

  // ========== SECTION 5: DELIVERY ==========
  deliverySerialNumber?: string | null;
  deliveryHelper?: string | null;
  deliveryDriver?: string | null;
  deliveryRemarks?: string | null;
  deliveryStatus?: string | null;
  deliveryDate?: string | null;

  // ========== SECTION 6: TRANSFER ==========
  transferAddress?: string | null;
  transferTime?: string | null;
  dateOfTransfer?: string | null;
  dateReceived?: string | null;

  // ========== SECTION 6B: BURIAL / CREMATION ==========
  dateOfBurial?: string | null;
  takeOff?: string | null;
  massTime?: string | null;
  burialDriver?: string | null;
  burialHelper?: string | null;
  familyCar?: string | null;
  familyCarDriver?: string | null;
  flowerCar?: string | null;
  flowerCarDriver?: string | null;
  carRental?: string | null;
  carRentalDriver?: string | null;
  setupCrew?: string | null;
  cremationTime?: string | null;
  cremationDate?: string | null;
  cremationOperator?: string | null;
  burialBenefit?: string | null;
  pallBearrer?: string | null;
  funeralDirector?: string | null;
  church?: string | null;
  cementary?: string | null;

  // ========== SECTION 7: EMBALMING & MAKEUP ==========
  dateEmblamed?: string | null;
  timeFinished?: string | null;
  makeupDressUp?: string | null;
  makeUprequest?: string | null;
  bodySpecialInstruction?: string | null;
  nails?: string | null;
  lips?: string | null;
  embalmers?: string | null;
  finishedBy?: string | null;
  embalmedBy?: string | null;

  // ========== SECTION 8: MEDICAL ==========
  autopsy?: string | null;
  autopsyDate?: string | null;
  autopsyBy?: string | null;

  // ========== SECTION 9: IDENTIFICATION ==========
  idType?: string | null;
  claimIdNumber?: string | null;
  seniorId?: string | null;
  issuedAt?: string | null;
  issuedOn?: string | null;

  // ========== SECTION 10: GOVERNMENT / SIGNATURES ==========
  baranggayIndigent?: string | null;
  baranggayCaptain?: string | null;
  cityDocsCompletion?: boolean;
  supSigBurial?: string | null;
  omSigDelivery?: string | null;
  omSigBurial?: string | null;
  chapelRental?: string | null;

  // ========== SECTION 10B: FLAGS ==========
  familyWillConvo?: boolean;
  cleared?: boolean;
  collectorRemarks?: boolean;

  // ========== SECTION 10C: REMARKS ==========
  remarks?: string | null;
  billingRemarks?: string | null;

  // ========== SECTION 11: ADMIN / TIMESTAMPS ==========
  startOfTransaction?: string | null; // datetime-local
  dateSubmitted?: string | null;
  timeEncoded?: string | null;
  dateAshReleased?: string | null;
  releasedBy?: string | null;
  receivedBy?: string | null;
}