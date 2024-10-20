
import { Injectable } from '@angular/core'; // Used to make the service injectable.
import { Auth, onAuthStateChanged } from '@angular/fire/auth'; // Used to get the current user and subscribe to the auth state.
import {
  addDoc, // Used to add a document to Firestore.
  collection, // Used to create a reference to a collection in Firestore.
  collectionData, // Used to create an observable that will emit the current value of the tasks array.
  CollectionReference, // Used to create a reference to a collection in Firestore.
  deleteDoc, // Used to delete a document in Firestore.
  doc, // Used to get a reference to a document in Firestore.
  Firestore, // Used to interact with Firestore.
  query, // Used to create a query to get the tasks for the current user.
  updateDoc, // Used to update a document in Firestore.
  where, // Used to create a query to get the tasks for the current user.
} from '@angular/fire/firestore'; // Import the functions needed to interact with Firestore.
import { BehaviorSubject, Observable, Subscription } from 'rxjs'; // Used to create an observable that will emit the current value of the tasks array.

// Task is an interface that defines the structure of a task. The ? after the property name means that the property is optional.
export interface Task {
  id?: string;            // The id is optional because Firestore does not store the id in the document.
  content: string;
  completed: boolean;
  user?: string;          // The user id is optional because Firestore does not store the user id in the document.
}

// The @Injectable decorator is used to make the service injectable. The service is injected into the constructor.
// The providedIn option is used to specify that the service should be provided in the root injector (AppModule).
// This means that the service will be available to the entire application.
@Injectable({
  providedIn: 'root',
})
export class TasksService {
  // Create a reference to the tasks collection. This is a reference to the collection in Firestore.
  private collectionRef: CollectionReference;
  // Create a BehaviorSubject observable. This stores the current value of tasks and will emit its current value to any new subscribers immediately upon subscription
  private tasks$: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);
  // Create a subscription to the tasks collection. This is a subscription to the collection in Firestore.
  private tasksSub!: Subscription;

  constructor(
    private firestore: Firestore, // Inject the Firestore service.
    private auth: Auth // Inject the Auth service.
  ) {
    // Create a reference to the tasks collection. This is a reference to the collection in Firestore.
    this.collectionRef = collection(this.firestore, 'tasks'); // The second argument is the path to the collection in Firestore.
    // Subscribe to the auth state. This will allow us to subscribe to the tasks collection when the user logs in.
    this.subscribeToAuthState();
  }

  /**
   * Subscribes to the authentication state of the application.
   * This method is called when the authentication state changes (i.e., when a user logs in or out).
   * If a user is logged in, it subscribes to the tasks of the logged-in user by calling `subscribeToTasks`.
   * If no user is logged in, it unsubscribes from the tasks by calling `unsubscribeFromTasks`.
   */
  private subscribeToAuthState(): void {
    onAuthStateChanged(this.auth, (user) => { // When the authentication state changes, check if a user is logged in. 
      if (user) { // If a user is logged in
        this.subscribeToTasks(user.uid); // subscribe to users tasks
      } else { // If no user is logged in 
        this.unsubscribeFromTasks(); // unsubscribe from tasks. This will save resources and prevent errors.
      }
    });
  }

  private subscribeToTasks(userId: string): void {
    // Create a query to get only the tasks for the current user.
    const tasksQuery = query(this.collectionRef, where('user', '==', userId));

    // Create an observable that will emit the current value of the tasks array.
    const tasks$ = collectionData(tasksQuery, {
      idField: 'id', // Include the document ID in the emitted data, under the field name 'id'.
    }) as Observable<Task[]>; // Treat the result of collectionData as an Observable that emits arrays of Task objects

    // Subscribing to an Observable. This is the process of connecting a consumer (usually a function) to the Observable.
    // When you subscribe to an Observable, you provide a function that will be called each time the Observable emits a new value. 
    // In this case, the function takes one argument, tasks, which will be the new value emitted by the Observable.
    this.tasksSub = tasks$.subscribe((tasks) => {
      this.tasks$.next(tasks); // Calling next emits a new value to its subscribers. In this case, it's emitting the tasks value that was just received from collectionSub and it's emitting it to the tasks$ BehaviorSubject.
    });
  }

  // Clear Tasks and unsubscribe from tasks observable. This saves resources and prevents errors.
  private unsubscribeFromTasks(): void {
    this.tasks$.next([]); // Clear tasks by emitting an empty array to the tasks$ BehaviorSubject.
    if (this.tasksSub) { // If there is a subscription to the tasks collection
      this.tasksSub.unsubscribe(); // unsubscribe from the tasks collection
    }
  }

  // Create a task and add it to the tasks collection. This will add a document to the collection on Firestore.
  async createTask(task: Task) {
    try {
      await addDoc(this.collectionRef, { // Add a document to the collection. The first argument is the reference to the collection. The second argument is the document to add to the collection.
        ...task, // Use the spread operator to add the task properties to the document.
        user: this.auth.currentUser?.uid, // Add the user id to the document. This will allow us to query the tasks for the current user.
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  // Return the tasks BehaviorSubject as an observable. This will allow us to subscribe to the tasks array.
  // The async keyword is not needed here because we are not calling to firestore.
  readTasks() {
    return this.tasks$.asObservable(); //returning an Observable version of the tasks$ BehaviorSubject that can be safely exposed to consumers
  }

  updateTask(task: Task) {
    // Use the task id to get the reference to the document
    const ref = doc(this.firestore, `tasks/${task.id}`);
    // Update the document. Here we set the value of the content field to the value of the task.content
    return updateDoc(ref, { content: task.content });
  }

  async deleteTask(task: Task) {
    try {
      // Use the task id to get the reference to the document
      const ref = doc(this.firestore, `tasks/${task.id}`);
      // Delete the document
      await deleteDoc(ref);
    } catch (error) {
      // Log the error to the console
      console.error('Error deleting document: ', error);
    }
  }

  // This method is used update the checkbox in the Firestore database when the user toggles the checkbox in the UI.
  async toggleTaskCompleted(task: Task) {
    try {
      // Use the task id to get the reference to the document
      const ref = doc(this.firestore, `tasks/${task.id}`);
      // Update the document. Here we set the value of the completed field to the value of the task.completed
      return updateDoc(ref, { completed: task.completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }
}
