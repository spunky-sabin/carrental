import DesktopLogin from "@/components/DesktopLogin";
import MobileLogin from "@/components/MobileLogin";
import { AppScreen } from "@/components/app/AppUI";

export default function LoginPage() {
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
