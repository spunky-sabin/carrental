import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DesktopSignup from "@/components/DesktopSignup";
import MobileSignup from "@/components/MobileSignup";

export default async function SignupPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/home");
  }

  return (
    <main>
      <div className="hidden lg:block">
        <DesktopSignup />
      </div>
      <div className="lg:hidden">
        <MobileSignup />
      </div>
    </main>
  );
}
