// ==========================================
//  FIREBASE CONFIG — flowerart-9f72b
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCFl7mebeXiw0SwjaSQfWeYIyCNvSIYb7I",
  authDomain:        "flowerart-9f72b.firebaseapp.com",
  projectId:         "flowerart-9f72b",
  storageBucket:     "flowerart-9f72b.firebasestorage.app",
  messagingSenderId: "95036352572",
  appId:             "1:95036352572:web:64e0c1add6b962acdd3b39",
  measurementId:     "G-G3THC2LD4Q"
};

const app       = initializeApp(firebaseConfig);
const db        = getFirestore(app);
const analytics = getAnalytics(app);

export { db };
