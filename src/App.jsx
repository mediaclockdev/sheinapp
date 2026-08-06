import { AppRouter } from "./router/AppRouter";
import { Toaster } from "./components/Toast";
import { useEffect } from "react";
import { requestFirebaseToken, messaging } from "./config/firebase";
import { onMessage } from "firebase/messaging";
import axios from "axios";

function App() {
  const API_BASE = "https://shelynx.mediaclocksoft.com.au";
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestFirebaseToken();
      if (token) {
        console.log("My firebase token is: ", token);

        await axios.patch(
          `${API_BASE}/api/agent-profile/fcm-token`,
          {
            fcmToken: token,
          },
          authHeaders(),
        );
      }
    };
    setupNotifications();
    let unsubscribe = null;
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received: ", payload);
        alert(
          `New Message: ${payload.notification.title}\n${payload.notification.body}`
        );
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
    </>
  );
}

export default App;
