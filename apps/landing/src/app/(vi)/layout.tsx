import type { ReactNode } from "react";
import { Document } from "../document";

export { viewport } from "../document";

export default function Layout({ children }: { children: ReactNode }) {
  return <Document lang="vi">{children}</Document>;
}
