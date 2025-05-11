import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  imports: [ReactiveFormsModule,NgIf],
  styleUrls: ['./test.component.css'] // ✅ Fix typo here
})
export class TestComponent implements OnInit {
  timeForm!: FormGroup; // ✅ Use non-null assertion
  currentTime: string;

  constructor(private fb: FormBuilder) {
    const now = new Date();
    this.currentTime = now.toTimeString().substring(0, 5); // format HH:mm
  }

  ngOnInit(): void {
    this.timeForm = this.fb.group({
      startTime: ['', [Validators.required, this.futureTimeValidator()]],
      endTime: ['', [Validators.required, this.endTimeValidator.bind(this)]]
    });

    // Update end time validation when start time changes
    this.timeForm.get('startTime')?.valueChanges.subscribe(() => {
      this.timeForm.get('endTime')?.updateValueAndValidity();
    });
  }

  futureTimeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedTime = control.value;
      if (selectedTime <= this.currentTime) {
        return { pastTime: true };
      }
      return null;
    };
  }

  endTimeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const startTime = this.timeForm?.get('startTime')?.value;
    if (!startTime) return null;

    if (control.value <= startTime) {
      return { beforeStartTime: true };
    }
    return null;
  }

  get startTime() {
    return this.timeForm.get('startTime');
  }

  get endTime() {
    return this.timeForm.get('endTime');
  }
}
