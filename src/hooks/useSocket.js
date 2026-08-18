import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let globalSocket = null;
let connectionCount = 0;

export const useSocket = () => {
  const [socket, setSocket] = useState(globalSocket);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io("https://shelynx.mediaclocksoft.com.au", {
        auth: { token },
      });
    }

    setSocket(globalSocket);
    connectionCount++;

    return () => {
      connectionCount--;
      // Optionally disconnect if everything unmounts, but usually we keep it alive
      if (connectionCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  return { socket };
};
