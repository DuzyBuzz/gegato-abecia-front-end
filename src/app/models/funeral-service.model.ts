export interface FuneralService {

  id: number

  contractNo: string
  type: string

  firstName?: string
  middleName?: string
  lastName?: string

  religion?: string
  municipality?: string

  startOfTransaction?: number

}