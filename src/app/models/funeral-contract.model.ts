import { BurialSchedule } from "./burial-shcedule.model";
import { CasketUrn } from "./casket-urn.model";
import { ContractHeader } from "./contract-header.model";
import { ContractRemarks } from "./contract-remarks.model";
import { Contractee } from "./contractee.model";
import { Deceased } from "./deceased.model";
import { DeliveryInfo } from "./delivery-info.model";
import { TransferInfo } from "./transfer-info.model";

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
