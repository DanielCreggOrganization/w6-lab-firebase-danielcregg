/**
 * HomePage Component for managing user tasks
 * Includes task creation, updating, deletion, and user sign out functionality
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
   * The new task being created or edited
   */
  newTask: Task = {
    content: '',
    completed: false
  };

  /**
   * Reference to the modal in the template for task creation/editing
   */
  @ViewChild(IonModal) modal!: IonModal;
  
  /**
   * Observable stream of user tasks
   */
  userTasks$: Observable<Task[]>;

  /**
   * Service injections
   */
  private readonly authService = inject(AuthService);
  private readonly tasksService = inject(TasksService);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);

  constructor() {
    this.userTasks$ = this.tasksService.getUserTasks();
  }

  /**
   * Initialize icons when component loads
   */
  ngOnInit() {
    addIcons({ logOutOutline, pencilOutline, trashOutline, add });
  }

  /**
   * Resets the new task form to default values
   */
  resetTask() {
    this.newTask = {
      content: '',
      completed: false,
    };
  }

  /**
   * Signs out the current user and redirects to login page
   */
  async handleSignOut() {
    try {
      await this.authService.signOutUser();
      await this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (error) {
      console.error('Error signing out:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to sign out. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  /**
   * Validates if task content is non-empty after trimming
   */
  isTaskContentValid(): boolean {
    return Boolean(this.newTask.content && this.newTask.content.trim());
  }

  /**
   * Creates a new task
   */
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

  /**
   * Toggles the completion status of a task
   * @param ionCheckboxEvent - The checkbox event
   * @param task - The task to toggle
   */
  async toggleTask(ionCheckboxEvent: Event, task: Task) {
    try {
      task.completed = (ionCheckboxEvent as CheckboxCustomEvent).detail.checked;
      await this.tasksService.toggleTaskCompleted(task);
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert the checkbox state if the update fails
      task.completed = !task.completed;
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to update task status. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  /**
   * Opens an alert dialog to update task content
   * @param task - The task to update
   */
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
    
    // Focus the input field
    setTimeout(() => {
      const firstInput: HTMLInputElement | null = document.querySelector('ion-alert input');
      firstInput?.focus();
    }, 250);
  }

  /**
   * Deletes a task
   * @param task - The task to delete
   */
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

  /**
   * Closes the task modal and resets the form
   */
  cancel() {
    this.modal.dismiss(null, 'cancel');
    this.resetTask();
  }

  /**
   * Sets up auto-focus for the modal input field
   */
  ngAfterViewInit() {
    this.modal.ionModalDidPresent.subscribe(() => {
      setTimeout(() => {
        const firstInput: HTMLInputElement | null = document.querySelector('ion-modal input');
        firstInput?.focus();
      }, 250);
    });
  }
}