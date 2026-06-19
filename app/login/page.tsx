import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DesktopLogin from "@/components/DesktopLogin";
import MobileLogin from "@/components/MobileLogin";
import { AppScreen } from "@/components/app/AppUI";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/home");
  }

  return (
    <AppScreen profile={null}>
      <div className="hidden lg:block">
        <DesktopLogin />
      </div>
      <div className="lg:hidden">
        <MobileLogin />
      </div>
    </AppScreen>
  );
}
