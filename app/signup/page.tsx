import DesktopSignup from "@/components/DesktopSignup";
import MobileSignup from "@/components/MobileSignup";

export default function SignupPage() {
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
