export interface User {
  id: number;
  userId?: number;
  username: string;
  accountNumber?: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleAccess?: number;
}
// complete api response example for reference:
// { 
//     "name": "Tester, Tester",
//     "accountNumber": "ADMIN-002",
//     "dealer": null,
//     "password": "Admin",
//     "branch": null,
//     "accountType": null,
//     "branchId": 0,
//     "id": 52,
//     "roleAccess": 2,
//     "idCode": null,
//     "firstName": "Tester",
//     "lastName": "Tester",
//     "role": 0,
//     "debug": 0,
//     "auths": [
//         "USER"
//     ],
//     "cats": [],
//     "roleText": null,
//     "modGR": 0,
//     "modProj": 0,
//     "companyRole": "SUPER_USER"
// }