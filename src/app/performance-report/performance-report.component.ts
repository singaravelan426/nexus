import { Component, OnInit } from '@angular/core';
import { Database, ref, get, update } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-performance-report',
  templateUrl: './performance-report.component.html',
  styleUrls: ['./performance-report.component.css'],
   imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ]
})
export class PerformanceReportComponent implements OnInit {
  selectedDate: string = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  records: any[] = [];

  constructor(private db: Database) {}

  ngOnInit(): void {
    this.fetchTATData();
  }

  fetchTATData() {
  const logRef = ref(this.db, 'work-logs');
  const selectedFormattedDate = this.formatDate(this.selectedDate);

  get(logRef).then(snapshot => {
    this.records = [];

    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('✅ All data:', data);
      console.log('📅 Selected date to match:', selectedFormattedDate);

      for (const key in data) {
        const entry = data[key];
        console.log(`Checking entry ${key}: date = ${entry.date}`);

        if (entry.date === selectedFormattedDate) {
          console.log('✅ MATCH FOUND:', entry);
          this.records.push({
            dbKey: key,
            email: entry.email,
            projectTitle: entry.projectTitle,
            selectedTask: entry.selectedTask,
            startTime: entry.startTime,
            endTime: entry.endTime,
            submittedTAT: entry.tAt,
            approvedTAT: entry.approvedTAT || 0,
            sla: entry.sla || 0
          });
        }
      }

      if (this.records.length === 0) {
        console.warn('⚠️ No matching records found for date:', selectedFormattedDate);
      }
    } else {
      console.error('❌ No data exists at work-log.');
    }
  }).catch(err => {
    console.error('🔥 Error fetching data:', err);
  });
}


  submitUpdates() {
    const updates: Record<string, any> = {};

    this.records.forEach((entry) => {
      updates[`work-logs/${entry.dbKey}/approvedTAT`] = entry.approvedTAT;
      updates[`work-logs/${entry.dbKey}/sla`] = entry.sla;
    });

    update(ref(this.db), updates)
      .then(() => alert('TAT & SLA updated successfully.'))
      .catch(err => alert('Error: ' + err));
  }

  formatDate(dateStr: string): string {
  // input: '2025-06-20'
  const [year, month, day] = dateStr.split('-');
  const result = `${day}/${month}/${year}`;
  console.log('Formatted date:', result); // ⬅️ Add this
  return result;
}
  
}

