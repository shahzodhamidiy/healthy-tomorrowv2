import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BACKEND_ROOT } from "@/lib/api";

let _singleton = null;

export function getSocket() {
  if (_singleton) return _singleton;
  const token = localStorage.getItem("ht_token");
  _singleton = io(BACKEND_ROOT, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return _singleton;
}

export function useSocket(events = {}) {
  const handlersRef = useRef(events);
  handlersRef.current = events;

  useEffect(() => {
    const sock = getSocket();
    const onevs = Object.keys(handlersRef.current);
    onevs.forEach((ev) => {
      sock.on(ev, (...args) => handlersRef.current[ev](...args));
    });
    return () => {
      onevs.forEach((ev) => sock.off(ev));
    };
  }, []);

  return getSocket();
}
