import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getDatabase, ref, push, remove, onValue, set } from '@angular/fire/database';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-project',
  templateUrl: './admin-project.component.html',
  styleUrls: ['./admin-project.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class AdminProjectComponent implements OnInit {
  projectTitle = '';
  tasks: string[] = [''];
  projects: any[] = [];
  editMode = false;
  editingKey: string | null = null;
  originalProjectTitle = '';
  originalTasks: string[] = [];
  isActive: boolean = false;

  ngOnInit(): void {
    this.loadProjects();
  }

  addTaskField() {
    this.tasks.push('');
  }

  removeTask(index: number) {
    this.tasks.splice(index, 1);
  }

  // Pagination
  pageSize = 1;
  currentPage = 1;

  paginatedProjects() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.projects.slice(start, start + this.pageSize);
  }

  totalPages(): number[] {
    const pageCount = Math.ceil(this.projects.length / this.pageSize);
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages().length) {
      this.currentPage = page;
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  editProject(project: any) {
    this.editMode = true;
    this.editingKey = project.key;
    this.projectTitle = project.projectTitle;
    const taskObj = project.tasks || {};
    this.tasks = Object.values(taskObj);
    this.originalProjectTitle = project.projectTitle;
    this.originalTasks = [...this.tasks];
    this.isActive = project.active !== undefined ? project.active : true;
  }

  hasChanges(): boolean {
    return (
      this.projectTitle.trim() !== this.originalProjectTitle.trim() ||
      JSON.stringify(this.tasks.map(t => t.trim())) !== JSON.stringify(this.originalTasks.map(t => t.trim()))
    );
  }

  cancelEdit() {
    this.editMode = false;
    this.projectTitle = '';
    this.tasks = [''];
    this.originalProjectTitle = '';
    this.originalTasks = [];
    this.isActive = true;
  }

  saveProject() {
    if (!this.projectTitle.trim()) {
      alert('⚠️ Project title is required!');
      return;
    }

    const taskObj: any = {};
    this.tasks.forEach((task, index) => {
      if (task.trim()) {
        taskObj[`task${index + 1}`] = task;
      }
    });

    const db = getDatabase();

    if (this.editMode && this.editingKey) {
      const editRef = ref(db, `projects/${this.editingKey}`);
      set(editRef, {
        projectTitle: this.projectTitle,
        tasks: taskObj,
        active: this.isActive
      }).then(() => {
        alert('✅ Project updated!');
        this.resetForm();
        this.loadProjects();
      });
    } else {
      const projectRef = ref(db, 'projects');
      push(projectRef, {
        projectTitle: this.projectTitle,
        tasks: taskObj,
        active: this.isActive
      }).then(() => {
        alert('✅ Project saved!');
        this.resetForm();
        this.loadProjects();
      });
    }
  }

  resetForm() {
    this.projectTitle = '';
    this.tasks = [''];
    this.editingKey = null;
    this.editMode = false;
    this.isActive = false;
  }

  deleteProject(key: string) {
    const db = getDatabase();
    const projectRef = ref(db, `projects/${key}`);
    remove(projectRef).then(() => {
      this.loadProjects();
    });
  }

  loadProjects() {
    const db = getDatabase();
    const projectRef = ref(db, 'projects');
    onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      this.projects = [];
      if (data) {
        for (const key in data) {
          this.projects.push({ key, ...data[key] });
        }
        // ✅ Show latest projects first
      this.projects.reverse();
      }
    });
  }
}
