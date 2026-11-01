import { usePrefs } from "../prefs";
import { type AuthService, mockAuth } from "./auth";
import { liveAuth } from "./honda";

export function useAuth(): AuthService {
  const { prefs } = usePrefs();
  return __DEV__ && prefs.honda === "mock" ? mockAuth : liveAuth;
}
