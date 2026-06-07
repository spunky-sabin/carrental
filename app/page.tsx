import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DesktopLogin from "@/components/DesktopLogin";
import MobileLogin from "@/components/MobileLogin";

export default async function Home() {
  const session = await getSessionUser();
  if (session) {
    redirect("/home");
  }

  return (
    <main>
      <div className="hidden lg:block">
        <DesktopLogin />
      </div>
      <div className="lg:hidden">
        <MobileLogin />
      </div>
    </main>
  );
}
