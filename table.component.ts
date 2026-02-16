// src/app/table/table.component.ts
import { Component, OnInit } from '@angular/core';
import { PincodeService } from '../pincode.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html'
})
export class TableComponent implements OnInit {
  userList: any[] = [];

  constructor(private pinService: PincodeService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.pinService.getData().subscribe((res: any) => {
      this.userList = res.dataTable || res;
    });
  }

  updateUser(id: number) {
    // Fetch full user by id, then stash in localStorage and navigate
    this.pinService.getDataById(id).subscribe((res: any) => {
      const userWithIds = (res.dataTable && res.dataTable[0]) ? res.dataTable[0] : res[0];

      // Save in localStorage so the form can read it on init
      this.pinService.setSelectedUser(userWithIds);

      this.router.navigate(['/user-form']);
    });
  }

  deleteUser(id: number) {
    this.pinService.deleteData(id).subscribe(() => {
      alert('User deleted successfully!');
      this.loadData();
    });
  }
}