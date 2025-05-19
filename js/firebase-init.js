// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.firebasestorage.app",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d",
  measurementId: "G-VTNGJR7YRL"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, push, get, onValue };
