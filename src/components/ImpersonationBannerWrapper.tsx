import { getSession } from "@/lib/auth-helpers";
import ImpersonationBanner from "./ImpersonationBanner";

export default async function ImpersonationBannerWrapper() {
  const session = await getSession();

  if (!session?.impersonation?.isImpersonating) {
    return null;
  }

  return (
    <ImpersonationBanner
      impersonatedUserName={session.impersonation.impersonatedUserName || "Unknown User"}
      originalUserName={session.impersonation.originalUserName || "Admin"}
    />
  );
}
