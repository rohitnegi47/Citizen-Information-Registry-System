import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { PincodeService } from '../pincode.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  encapsulation: ViewEncapsulation.None
})
export class FormComponent implements OnInit {

  formData: any = {
    UserId: 0,
    Name: '',
    Email: '',
    DOB: '',
    Gender: '',
    StateId: 0,
    StateName: '',
    DistrictId: 0,
    DistrictName: '',
    CityId: 0,
    CityName: '',
    Pincode: '',
    IsEjective: 'Y',
    Mode: ''
  };

  states: any[] = [];
  districts: any[] = [];
  cities: any[] = [];
  pincodes: any[] = [];
  isUpdateMode = false;

  constructor(private pinService: PincodeService, private router: Router) {}

  ngOnInit(): void {
    console.log("INIT: Form Loaded");
    this.loadStates();

    const user = this.pinService.getSelectedUser();
    console.log("LocalStorage User:", user);

    if (user) {
      this.formData = {
        ...user,
        DOB: user.DOB?.split('T')[0] || ''
      };
      this.isUpdateMode = true;

      if (this.formData.StateId) this.onStateChange();
      if (this.formData.DistrictId) this.onDistrictChange();
    }
  }

  loadStates() {
    this.pinService.getLocation("STATE").subscribe((res: any) => {
      console.log("STATES RECEIVED:", res);
      this.states = res.dataTable || res;
    });
  }

  onStateChange() {
    console.log("STATE Changed:", this.formData.StateId);

    //  Only clear dependent fields when NOT in update mode
    if (!this.isUpdateMode) {
      this.districts = [];
      this.cities = [];
      this.pincodes = [];

      this.formData.DistrictId = null;
      this.formData.DistrictName = '';  
      this.formData.CityId = null;
      this.formData.CityName = '';
      this.formData.Pincode = '';
    }

    if (this.formData.StateId) {
      this.pinService.getLocation("DISTRICT", { stateId: this.formData.StateId })
        .subscribe((res: any) => {
          console.log("DISTRICTS RECEIVED:", res);
          this.districts = res.dataTable || res;
        });
    }
  }

  onDistrictChange() {
    console.log("DISTRICT Changed:", this.formData.DistrictId);

    const selected = this.districts.find(d => d.DistrictId === this.formData.DistrictId);
    this.formData.DistrictName = selected?.DistrictName || '';

    //  Only clear city when NOT in update mode
    if (!this.isUpdateMode) {
      this.formData.CityId = null;
      this.formData.CityName = '';
      this.cities = [];
    }

    if (this.formData.DistrictId) {
      this.pinService.getLocation("CITY", { districtId: this.formData.DistrictId })
        .subscribe((res: any) => {
          console.log("CITIES RECEIVED:", res);
          this.cities = res.dataTable || res;
        });
    }

    if (this.formData.DistrictName) {
      this.pinService.getLocation("PINCODE", { districtName: this.formData.DistrictName })
        .subscribe((res: any) => {
          console.log("PINCODES RECEIVED:", res);
          this.pincodes = res.dataTable || res;
        });
    }
  }

  onCityChange(cityId: number) {
    console.log("CITY Changed:", cityId);
    this.formData.CityId = cityId;
  }

  private mapToApiModel(formData: any) {
    return {
      userId: formData.UserId || 0,
      name: formData.Name,
      email: formData.Email,
      dob: formData.DOB,   // fixed casing
      gender: formData.Gender,

      stateId: formData.StateId,
      stateName: formData.StateName,

      districtId: formData.DistrictId,
      districtName: formData.DistrictName,

      cityId: formData.CityId,
      cityName: formData.CityName,

      pincode: String(this.formData.Pincode),
      isEjective: formData.IsEjective,
      mode: formData.Mode || ""
    };
  }

  saveForm(form: NgForm) {
    console.log("SAVE CLICKED");

    if (!form.valid) return;

    const payload = this.mapToApiModel(this.formData);

    console.log("FINAL PAYLOAD SENT TO API:", payload);

    if (this.isUpdateMode) {
      this.pinService.updateData(payload).subscribe(() => {
        alert("Updated Successfully!");
        this.pinService.clearSelectedUser();
        this.isUpdateMode = false;   //  reset mode after update
        this.router.navigate(['/user-table']);
      });
    } else {
      this.pinService.saveDataUsingSL(payload).subscribe({
    next: (response: any) => {
    console.log("Backend Response:", response);

    if (response.responseMessage === "response_is_successful") {
      alert("Saved Successfully! New UserID: "+response.idValue+" created");

      this.pinService.clearSelectedUser();
      this.router.navigate(['/user-table']);
    } else if (response.responseMessage === "invalid name") {
      alert("invalid name: please enter correct name");
    } else {
      alert("save failed");
    }
  },
  error: (error) => {
    console.error("Error occurred:", error);
    alert("Something went wrong while saving.");
  }
});
    }
  }
}