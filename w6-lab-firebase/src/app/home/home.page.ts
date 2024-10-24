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
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (data.content?.trim()) {
              this.tasks.createTask({
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
    await this.tasks.toggleTaskCompleted(task);
  }

  async editTask(task: Task, slidingItem: IonItemSliding) {
    const alert = await this.alerts.create({
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
            this.tasks.updateTask({ ...task, content: data.content });
            slidingItem.close();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteTask(task: Task, slidingItem: IonItemSliding) {
    await this.tasks.deleteTask(task);
    slidingItem.close();
  }

  async signOut() {
    await this.auth.signOutUser();
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }
}