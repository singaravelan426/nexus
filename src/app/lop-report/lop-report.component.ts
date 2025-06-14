import { Component, OnInit } from '@angular/core';
import { getDatabase, ref, onValue } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lop-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lop-report.component.html',
  styleUrls: ['./lop-report.component.css']
})
export class LopReportComponent implements OnInit {
  lopReport: any[] = [];
  filterText = '';

  // Pagination variables
  currentPage = 1;
  pageSize = 5;

  ngOnInit(): void {
    this.getMonthlyLeaveWithLOP();
  }

 getMonthlyLeaveWithLOP() {
  const db = getDatabase();
  const leaveRef = ref(db, 'leave-requests');

  onValue(leaveRef, (snapshot) => {
    const data = snapshot.val();
    const monthlyMap: { [key: string]: any } = {};

    for (const key in data) {
      const req = data[key];

      // Consider only approved leave requests
      if (req.type === 'Leave' && req.status === 'approved') {
        const email = req.email;
        const date = new Date(req.startDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const mapKey = `${email}_${monthKey}`;

        // Initialize if not already
        if (!monthlyMap[mapKey]) {
          monthlyMap[mapKey] = {
            email,
            month: new Date(date.getFullYear(), date.getMonth()).toLocaleString('default', {
              month: 'long',
              year: 'numeric'
            }),
            totalLeaves: 0,
            countOfHolidays: 0,
            totalLeaveRequest: 0
          };
        }

        // Accumulate values from each request
        monthlyMap[mapKey].totalLeaves += Number(req.countOfLeaves || 0);
        monthlyMap[mapKey].countOfHolidays += Number(req.countOfHolidays || 0);
        monthlyMap[mapKey].totalLeaveRequest += Number(req.totalLeaveRequest || 0);
      }
    }

    // Convert to array and calculate LOP
    const report = Object.values(monthlyMap).map(entry => {
      const lop = Math.max(0, entry.totalLeaves - 2);
      const paidLeave = entry.totalLeaves - lop;
      return {
        ...entry,
        lop,
        paidLeave
      };
    });

    this.lopReport = report;
  });
}



  get filteredReport() {
    const filtered = !this.filterText.trim()
      ? this.lopReport
      : this.lopReport.filter(row =>
          row.email.toLowerCase().includes(this.filterText.toLowerCase())
        );

    return filtered;
  }

  get paginatedReport() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReport.slice(start, start + this.pageSize);
  }

  getTotalPages() {
    return Math.ceil(this.filteredReport.length / this.pageSize);
  }

  get totalPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  downloadCSV() {
   let csvContent = 'Email,Month,Total Leaves,Paid Leave,LOP,Holidays,Total Leave Request\n';
this.filteredReport.forEach(row => {
  csvContent += `${row.email},${row.month},${row.totalLeaves},${row.paidLeave},${row.lop},${row.countOfHolidays},${row.totalLeaveRequest}\n`;
});

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lop-report.csv';
    link.click();
  }
}

