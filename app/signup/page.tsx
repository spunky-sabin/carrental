import DesktopSignup from "@/components/DesktopSignup";
import MobileSignup from "@/components/MobileSignup";
import { AppScreen } from "@/components/app/AppUI";

export default function SignupPage() {
  return (
    <AppScreen profile={null}>
      <div className="hidden lg:block">
        <DesktopSignup />
      </div>
      <div className="lg:hidden">
        <MobileSignup />
      </div>
    </AppScreen>
  );
}
