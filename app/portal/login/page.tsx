import { permanentRedirect } from "next/navigation";

export default function PortalLoginPage() {
  permanentRedirect("/member/login");
}
