// ==========================================
//  FIREBASE CONFIG — flower-5f122
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBh-CCFByaAPHyLtEMXCeRIDKH6hxDl_n4",
  authDomain:        "flower-5f122.firebaseapp.com",
  projectId:         "flower-5f122",
  storageBucket:     "flower-5f122.firebasestorage.app",
  messagingSenderId: "912142841872",
  appId:             "1:912142841872:web:5f76b9b2142b71131cb295"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
