/**
 * HomePage Component for managing tasks
 */
import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  LoadingController,
  CheckboxCustomEvent,
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
  IonModal,
  IonInput,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Observable } from 'rxjs';
import { logOutOutline, pencilOutline, trashOutline, add } from 'ionicons/icons';
import { AuthService } from '../auth.service';
import { TasksService, Task } from '../tasks.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonModal,
    IonInput,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
  ],
})
export class HomePage implements AfterViewInit {
  /**
   * The new task being created
   */
  newTask: Task = {
    content: '',
    completed: false
  };

  /**
   * Reference to the modal in the template
   */
  @ViewChild(IonModal) modal!: IonModal;
  
  /**
   * Observable of user tasks
   */
  userTasks$: Observable<Task[]>;

  private readonly authService = inject(AuthService);
  private readonly tasksService = inject(TasksService);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  constructor() {
    // Initialize the tasks observable
    this.userTasks$ = this.tasksService.getUserTasks();
  }

  ngOnInit() {
    addIcons({ logOutOutline, pencilOutline, trashOutline, add });
  }

  resetTask() {
    this.newTask = {
      content: '',
      completed: false,
    };
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  async addTask() {
    try {
      const loading = await this.loadingController.create({
        message: 'Adding task...'
      });
      await loading.present();
      
      await this.tasksService.createTask(this.newTask);
      
      await loading.dismiss();
      this.modal.dismiss(null, 'confirm');
      this.resetTask();
    } catch (error) {
      console.error('Error adding task:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to add task. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async toggleTask(ionCheckboxEvent: Event, task: Task) {
    try {
      task.completed = (ionCheckboxEvent as CheckboxCustomEvent).detail.checked;
      await this.tasksService.toggleTaskCompleted(task);
    } catch (error) {
      console.error('Error toggling task:', error);
      task.completed = !task.completed;
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to update task status. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async openUpdateInput(task: Task) {
    const alert = await this.alertController.create({
      header: 'Update Task',
      inputs: [
        {
          name: 'Task',
          type: 'text',
          placeholder: 'Task content',
          value: task.content,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          handler: async (data) => {
            try {
              task.content = data.Task;
              await this.tasksService.updateTask(task);
              return true; // Close the alert on success
            } catch (error) {
              console.error('Error updating task:', error);
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'Failed to update task. Please try again.',
                buttons: ['OK']
              });
              await errorAlert.present();
              return false; // Keep the alert open on error
            }
          },
        },
      ],
    });
    
    await alert.present();
    
    setTimeout(() => {
      const firstInput: HTMLInputElement | null = document.querySelector('ion-alert input');
      firstInput?.focus();
    }, 250);
  }

  async deleteTask(task: Task) {
    try {
      await this.tasksService.deleteTask(task);
    } catch (error) {
      console.error('Error deleting task:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to delete task. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
    this.resetTask();
  }

  ngAfterViewInit() {
    this.modal.ionModalDidPresent.subscribe(() => {
      setTimeout(() => {
        const firstInput: HTMLInputElement | null = document.querySelector('ion-modal input');
        firstInput?.focus();
      }, 250);
    });
  }
}