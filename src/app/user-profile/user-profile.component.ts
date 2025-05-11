import { Component, OnInit } from '@angular/core';
import { Auth, updatePassword, User } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [ReactiveFormsModule, CommonModule,RouterModule],
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  userName: string = '';
  profileImageUrl: string = '';
  changePassForm: FormGroup;
  userEmail: any = '';
  isLoadingProfile = true;

  
  userInitials: string = '';

  constructor(
    private auth: Auth,
    private db: Database,
    private fb: FormBuilder
  ) {
    this.changePassForm = this.fb.group({
      newPassword: ['']
    });
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user;
        this.userName = user.email?.split('@')[0] ?? '';
        this.userEmail = user.email ?? '';
        this.userName = this.userName.charAt(0).toUpperCase() + this.userName.slice(1).toLowerCase();
        this.userInitials = this.getInitials(this.userEmail);
        this.loadProfilePicture(); // ✅ Reuse the working method
        

      }
    });
  }
  handleImageError() {
    this.profileImageUrl = ''; // triggers initials display
  }

  getInitials(email: string): string {
    const name = email.split('@')[0];
    const nameParts = name.split('.');
    return nameParts.map(part => part.charAt(0).toUpperCase()).join('');
  }

  loadProfilePicture(): void {
    console.log('Fetching image for:', this.userName);
    const imageRef = ref(this.db, `profile-images/${this.userName}`);
    get(imageRef).then(snapshot => {
      if (snapshot.exists()) {
        console.log('Image found');
        this.profileImageUrl = snapshot.val(); // base64 string or URL
      } else {
        console.log('No image found');
        this.profileImageUrl = ''; // ✅ this lets *ngIf hide the image
      }
    }).catch(error => {
      console.error('Error fetching profile image:', error);
      this.profileImageUrl = ''; // ✅ fallback on error
    });
  }
  
 
 
 
}
