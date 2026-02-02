import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UsersTableComponent } from "../../shared/features/users/user-table/user-table.component";

@Component({
  selector: 'app-users',
  imports: [UsersTableComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {

}
