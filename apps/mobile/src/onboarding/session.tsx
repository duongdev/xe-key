import { createContext, type ReactNode, useContext, useState } from "react";
import type { FoundCar } from "../services/auth";

type Session = {
  phone: string | null;
  setPhone: (p: string) => void;
  car: FoundCar | null;
  setCar: (c: FoundCar) => void;
};

const Ctx = createContext<Session | null>(null);

/** In-memory state shared by the onboarding steps; gone once onboarding ends. */
export function OnboardingSession({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [car, setCar] = useState<FoundCar | null>(null);
  return <Ctx value={{ phone, setPhone, car, setCar }}>{children}</Ctx>;
}

export function useOnboarding(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error("useOnboarding outside OnboardingSession");
  return s;
}
