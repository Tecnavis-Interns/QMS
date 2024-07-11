
import { pubsub } from "firebase-functions";
import { initializeApp, firestore } from "firebase-admin";

initializeApp();

export const dailyReset = pubsub.schedule("0 0 * * *")
    .timeZone("Asia/Kolkata") // Indian Standard Time
    .onRun(async (context) => {
      const db = firestore();
      const collectionsToReset = ["requests", "queue"];

      for (const collectionName of collectionsToReset) {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.get();
        const batch = db.batch();

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      }

      console.log("Collections reset at", new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata"}));
      return null;
    });
