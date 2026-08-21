import { AppRouter } from "./router/AppRouter";
import { Toaster } from "./components/Toast";
import {
  NotificationToaster,
  notificationToast,
} from "./components/NotificationToast";
import { useEffect } from "react";
import { messaging } from "./config/firebase";
import { onMessage } from "firebase/messaging";

function App() {


  useEffect(() => {
    let unsubscribe = null;
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received: ", payload);
        
        // Skip firing the generic FCM toast for chat messages, 
        // because Conversations.jsx fires a rich, clickable toast via Socket.io!
        const isMessage = payload.data?.type === "MESSAGE" || 
                          payload.data?.conversationId || 
                          payload.notification?.title?.includes("message");
        
        if (!isMessage) {
          notificationToast.message({
            title: payload.notification?.title || "New Notification",
            body: payload.notification?.body || "",
          });
        }
      });
    }

    // Clean up the listener when the component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <>
      <AppRouter />
      <Toaster />
      <NotificationToaster />
    </>
  );
}

export default App;
