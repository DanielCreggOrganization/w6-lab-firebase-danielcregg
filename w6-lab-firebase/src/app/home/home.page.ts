import { Component, inject } from '@angular/core';
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
import { logOutOutline, pencilOutline, trashOutline, add } from 'ionicons/icons';
import { AuthService } from '../auth.service';
import { TasksService, Task } from '../tasks.service';

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
  private authService = inject(AuthService);
  private tasksService = inject(TasksService);
  private routerService = inject(Router);
  private alertController = inject(AlertController);

  // Get the user's tasks from the tasks service
  userTasks$ = this.tasksService.getUserTasks();
  // Get the current user from the auth service to display the user's email at the bottom of the page
  currentUser = this.authService.fetchActiveUser();

  constructor() {
    // Add the necessary icons to the page
    addIcons({ logOutOutline, pencilOutline, trashOutline, add });
  }

  async addTask() {
    const alert = await this.alertController.create({
      header: 'New Task',
      inputs: [
        {
          name: 'content',
          type: 'text',
          placeholder: 'Enter task description'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (data.content?.trim()) {
              this.tasksService.createTask({
                content: data.content,
                completed: false
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async toggleTask(event: Event, task: Task) {
    task.completed = (event as CustomEvent).detail.checked;
    await this.tasksService.toggleTaskCompleted(task);
  }

  async editTask(task: Task, slidingItem: IonItemSliding) {
    const alert = await this.alertController.create({
      header: 'Update Task',
      inputs: [{ 
        name: 'content', 
        value: task.content, 
        type: 'text' 
      }],
      buttons: [
        { 
          text: 'Cancel', 
          role: 'cancel',
          handler: () => slidingItem.close()
        },
        { 
          text: 'Update',
          handler: (data) => {
            this.tasksService.updateTask({ ...task, content: data.content });
            slidingItem.close();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteTask(task: Task) {
    await this.tasksService.deleteTask(task);
  }

  async signOut() {
    await this.authService.signOutUser();
    await this.routerService.navigateByUrl('/', { replaceUrl: true });
  }
}