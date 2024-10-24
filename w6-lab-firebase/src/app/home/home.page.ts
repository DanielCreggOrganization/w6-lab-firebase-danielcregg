import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonList,
  IonItemSliding,
  IonItem,
  IonLabel,
  IonIcon,
  IonCheckbox,
  IonItemOptions,
  IonItemOption,
  IonFooter,
  IonText,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Observable } from 'rxjs';
import { logOutOutline, pencilOutline, trashOutline, add } from 'ionicons/icons';
import { AuthService } from '../auth.service';
import { TasksService, Task } from '../tasks.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonItemOptions,
    IonItemOption,
    IonFooter,
    IonText,
    IonFab,
    IonFabButton,
  ],
})
export class HomePage {
  userTasks$: Observable<Task[]>;
  currentUser: User | null;

  constructor(
    private auth: AuthService,
    private tasks: TasksService,
    private router: Router,
    private alerts: AlertController
  ) {
    this.userTasks$ = this.tasks.getUserTasks();
    this.currentUser = this.auth.getCurrentUser();
    addIcons({ logOutOutline, pencilOutline, trashOutline, add });
  }

  async addTask() {
    const alert = await this.alerts.create({
      header: 'New Task',
      inputs: [
        {
          name: 'content',
          type: 'text',
          placeholder: 'Enter task description'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (data) => {
            if (!data.content?.trim()) return false;
            
            try {
              await this.tasks.createTask({
                content: data.content,
                completed: false
              });
              return true;
            } catch {
              this.showError('Failed to add task');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
    setTimeout(() => {
      const input = document.querySelector('ion-alert input') as HTMLInputElement;
      input?.focus();
    }, 250);
  }

  async toggleTask(event: Event, task: Task) {
    try {
      task.completed = (event as CustomEvent).detail.checked;
      await this.tasks.toggleTaskCompleted(task);
    } catch {
      task.completed = !task.completed;
      this.showError('Failed to update task status');
    }
  }

  async editTask(task: Task) {
    const alert = await this.alerts.create({
      header: 'Update Task',
      inputs: [{ 
        name: 'content', 
        value: task.content, 
        type: 'text' 
      }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Update',
          handler: async (data) => {
            try {
              await this.tasks.updateTask({ ...task, content: data.content });
              return true;
            } catch {
              this.showError('Failed to update task');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
    setTimeout(() => {
      const input = document.querySelector('ion-alert input') as HTMLInputElement;
      input?.focus();
    }, 250);
  }

  async deleteTask(task: Task) {
    try {
      await this.tasks.deleteTask(task);
    } catch {
      this.showError('Failed to delete task');
    }
  }

  async signOut() {
    try {
      await this.auth.signOutUser();
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch {
      this.showError('Failed to sign out');
    }
  }

  private async showError(message: string) {
    const alert = await this.alerts.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}