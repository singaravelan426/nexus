import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Database, ref, onValue } from '@angular/fire/database';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { RouterModule } from '@angular/router';
import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-work-detail',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './work-detail.component.html',
  styleUrl: './work-detail.component.css'
})
export class WorkDetailComponent implements OnInit {
  email: string = '';
  employeeName: string = '';
leaveRequests: any[] = [];

  onsiteVisits: number = 0;
  offsiteVisits: number = 0;
  onsiteHours: number = 0;
  offsiteHours: number = 0;
  onsitePercentage: number = 0;
  offsitePercentage: number = 0;

  totalWorkSeconds: number = 0;
formattedTotalDuration: string = '';

  logs: any[] = [];
  chart: Chart | null = null;

  constructor(private route: ActivatedRoute, private db: Database) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      if (this.email) {
        this.employeeName = this.getUsername(this.email);
        this.fetchWorkLogs();
      }
    });
  }

  getUsername(email: string): string {
    return email.split('@')[0];
  }

  fetchWorkLogs(): void {
  const workLogsRef = ref(this.db, 'work-logs');
  const leaveRequestsRef = ref(this.db, 'leave-requests');

  onValue(workLogsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const logs = Object.values(data).filter((log: any) => log.email === this.email);
      this.logs = logs;

      let onsiteCount = 0;
      let offsiteCount = 0;
      let onsiteTotalMinutes = 0;
      let offsiteTotalMinutes = 0;

      const chartData: { [date: string]: number } = {};

      logs.forEach((log: any) => {
        const duration = this.parseDuration(log.duration); // in minutes

        if (log.location === 'on-site') {
          onsiteCount++;
          onsiteTotalMinutes += duration;
        } else if (log.location === 'off-site') {
          offsiteCount++;
          offsiteTotalMinutes += duration;
        }

        const date = log.date;
        if (!chartData[date]) chartData[date] = 0;
        chartData[date] += duration;
      });

      this.onsiteVisits = onsiteCount;
      this.offsiteVisits = offsiteCount;
      this.onsiteHours = Math.floor(onsiteTotalMinutes / 60);
      this.offsiteHours = Math.floor(offsiteTotalMinutes / 60);

      const totalHours = this.onsiteHours + this.offsiteHours;
      this.onsitePercentage = totalHours ? Math.round((this.onsiteHours / totalHours) * 100) : 0;
      this.offsitePercentage = totalHours ? Math.round((this.offsiteHours / totalHours) * 100) : 0;
        
      this.totalWorkSeconds = logs.reduce((sum: number, log: any) => {
  return sum + this.parseDurationToSeconds(log.duration);
}, 0);
console.log('Logs filtered:', logs);

this.formattedTotalDuration = this.formatSecondsToHHMMSS(this.totalWorkSeconds);
      this.renderChart(chartData);
    }
  });

  // Fetch leave requests for same user
  onValue(leaveRequestsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const leaveLogs = Object.values(data).filter((log: any) => log.email === this.email);
      this.leaveRequests = leaveLogs;
    }
  });
}




  parseDuration(duration: string): number {
    const [h, m, s] = duration.split(':').map(Number);
    return h * 60 + m + (s > 0 ? 1 : 0); // round up to 1 min if seconds exist
  }

  

  renderChart(data: { [date: string]: number }): void {
    
    const labels = Object.keys(data).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/').map(Number);
      const [dayB, monthB, yearB] = b.split('/').map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });

    const values = labels.map(label => parseFloat((data[label] / 60).toFixed(2))); // convert to hours

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('workChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Work Duration (Hours)',
          data: values,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension:0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: {
              display: true,
              text: 'Hours'
            },
            beginAtZero: true
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  }

 downloadExcel(): void {
  if (!this.logs.length && !this.leaveRequests.length) return;

  const workSheetLogs = this.logs.map(log => ({
    Date: log.date,
    'Email':log.email,
    'Start Time': log.startTime,
    'End Time': log.endTime,
    Duration: log.duration,
    Location: log.location,
    Project: log.projectTitle,
    'Submitted At': log.submittedAt,
  }));

  const workSheetLeaves = this.leaveRequests.map(req => ({
   
    'Email':req.email,
    'Leave Type':req.type,
    'Start Date':req.startDate,
    'End Date':req.endDate,
    'Start Time': req.startTime,
    'End Time': req.endTime,
    Reason: req.reason || '',
    Status: req.status || '',
    'Submitted At': req.submittedAt,
    'Total Request Leave':req.totalLeaveRequest,
    'Holidays':req.countOfHolidays,
    'Total Leaves':req.countOfLeaves,
    'Admin Comment': req.adminComment,
  }));

  const workSheet1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(workSheetLogs);
  const workSheet2: XLSX.WorkSheet = XLSX.utils.json_to_sheet(workSheetLeaves);

  const workbook: XLSX.WorkBook = {
    Sheets: {
      'Work Report': workSheet1,
      'Leave Requests': workSheet2,
    },
    SheetNames: ['Work Report', 'Leave Requests']
  };

  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, `${this.employeeName}_FullReport.xlsx`);
}

parseDurationToSeconds(duration: string): number {
  const [h, m, s] = duration.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

formatSecondsToHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
}

}
