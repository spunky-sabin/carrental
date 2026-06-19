import EnterVerification from "@/components/EnterVerification";
import DesktopVerification from "@/components/DesktopVerification";

export default function VerificationPage() {
  return (
    <main>
      <div className="hidden lg:block">
        <DesktopVerification />
      </div>
      <div className="lg:hidden">
        <EnterVerification />
      </div>
    </main>
  );
}
