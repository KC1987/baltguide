

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCab0OQw7UY_pJl4IVxB6819MGlab7EONE",
  authDomain: "baltguide-fb067.firebaseapp.com",
  projectId: "baltguide-fb067",
  storageBucket: "baltguide-fb067.firebasestorage.app",
  messagingSenderId: "854114826402",
  appId: "1:854114826402:web:f5539dd13ae4848fbe3ffb",
  measurementId: "G-TV4CD1B2MB"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore();
// export const auth = getAuth();
export const storage = getStorage();

// function userStore() {
//     let unsubscribe: () => void;
//
//     if( !auth || !globalThis.window) {
//         console.warn("Auth is not initialized or not in browser");
//         const { subscribe } = writable<User | null>(null);
//         return {
//             subscribe,
//         }
//     }
//
//     const { subscribe } = writable(auth?.currentUser ?? null, (set) => {
//         onAuthStateChanged(auth, user => {
//             set(user);
//         });
//
//         return () => unsubscribe();
//     })
//
//     return {
//         subscribe,
//     }
//
// }
// export const user = userStore();
//
//
//
// export const userData = writable<any>(null);
//
// user.subscribe((user) => {
//
//     if (user) {
//         const docRef = doc(db, `users/${user.uid}`);
//         onSnapshot(docRef, (snapshot) => {
//             userData.set(snapshot.data());
//         });
//     }
// });
