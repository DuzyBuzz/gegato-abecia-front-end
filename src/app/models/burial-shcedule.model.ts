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
