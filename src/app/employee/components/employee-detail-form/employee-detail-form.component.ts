import { Component, Input, OnInit,   } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../employee-model';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MatDialog } from '@angular/material/dialog';
import { DatePickerComponent } from 'src/app/common/date-picker/date-picker.component';
import { EmployeeService } from '../../employee.service';

@Component({
  selector: 'app-employee-detail-form',
  templateUrl: './employee-detail-form.component.html',
  styleUrls: ['./employee-detail-form.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class EmployeeDetailFormComponent implements OnInit{

  employee: any;
  employeeForm: FormGroup;
  layout: string;
  toShowFromCalendar: boolean = false;
  toShowToCalendar: boolean = false;
  selectedDate = null;
  roles = [
    {id: 1, name: 'Product Designer'},
    {id: 2, name: 'Flutter Developer'},
    {id: 3, name: 'QA Tester'},
    {id: 4, name: 'Product Owner'}
  ]

  constructor(private fb: FormBuilder, private datepipe: DatePipe, private router: Router, 
    private dbService: NgxIndexedDBService, public dialog: MatDialog,
    private route: ActivatedRoute) {

  }

  ngOnInit(): void {
    let id: any;
    this.route.paramMap.subscribe(params => {
      id = params.get('id'); 
    });
    if(id) {
      this.dbService.getAll('employees').subscribe((result: any) => {
        this.employee = result.find((item:any) => item.id == Number(id));
        this.toInitEmployeeForm();
      }); 
    } else{
      this.toInitEmployeeForm();
    }
  }

  toInitEmployeeForm() {
    this.employeeForm = this.fb.group({
      id: [''],
      name: [this.employee? this.employee.name : '', Validators.required],
      position: [this.employee? this.employee.position : '', Validators.required],
      fromDate: [this.employee? this.employee.fromDate : '', Validators.required],
      toDate: [ this.employee? this.employee.toDate : null]
    })
    const fromDateControl = this.employeeForm.get('fromDate')
    if(!fromDateControl?.value) {
      this.employeeForm.get('toDate')?.disable()
    }
    this.employeeForm.get('fromDate')?.valueChanges.subscribe(value => {
      const toDateControl = this.employeeForm.get('toDate');
      if (value.trim() === '') {
        toDateControl?.disable()
      } else {
        toDateControl?.enable()
      }

      if(new Date(value) > new Date(toDateControl?.value)) {
        this.employeeForm.patchValue({
          toDate: ''
        })
      }
    })
  }

  onCancel(): void {
    this.router.navigate(['/employee'])
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      if(this.employee) {
        this.employeeForm.setValue({
          id: this.employee.id,
          name: this.employeeForm.get('name')?.value,
          position: this.employeeForm.get('position')?.value,
          fromDate: this.employeeForm.get('fromDate')?.value,
          toDate: this.employeeForm.get('toDate')?.value,
        })
        this.dbService.update('employees', this.employeeForm.value).subscribe((res) => {})
      } else {
        this.employeeForm.removeControl('id');
        this.dbService.add('employees', this.employeeForm.value).subscribe((res) => {})
      }
    }
    this.router.navigate(['/employee'])
  }

  toGetSelectedFromDate(date: any) {
    let fromDate = this.datepipe.transform(date, 'dd-MMM-yyyy');
    this.employeeForm.patchValue({
      fromDate: fromDate
    })
    this.toShowFromCalendar = false;
  }

  toGetSelectedToDate(date: any | null) {
    if (date) {
      let toDate = this.datepipe.transform(date, 'dd-MMM-yyyy');
      this.employeeForm.patchValue({
        toDate: toDate
      })
    } else {
      this.employeeForm.patchValue({
        toDate: 'No Date'
      })
    }
    this.toShowToCalendar = false;
  }

  toggleFromCalendar(): void {
    this.toShowToCalendar = false;
    this.toShowFromCalendar = !this.toShowFromCalendar;
  }

  toggleToCalendar(): void {
    this.toShowFromCalendar = false;
    this.toShowToCalendar = !this.toShowToCalendar;
  }

  openDatePicker(isFromDate: boolean) {
    const dialogRef = this.dialog.open(DatePickerComponent, {
      // panelClass: 'mat-dialog-container',
      data: { pickedDate:isFromDate ? this.employeeForm.get('fromDate')?.value : this.employeeForm.get('toDate')?.value, 
        toDate: isFromDate, calendarVisible: true, minDate: this.employeeForm.get('fromDate')?.value },
    });

    dialogRef.afterClosed().subscribe(date => {
      if(isFromDate) {
        this.toGetSelectedFromDate(date) 
      } else{
        this.toGetSelectedToDate(date)
      }
    });
  }

  ngOnDestroy(): void {

  }
}
