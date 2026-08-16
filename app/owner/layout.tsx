import { redirect } from "next/navigation";
import { requireOwnerUser } from "@/lib/owner";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let access;
  try {
    access = await requireOwnerUser();
  } catch (err) {
    // Prevent unexpected server errors from returning 500. Log and redirect to home.
    // This avoids exposing a broken server-rendered page while further debugging is performed.
    // eslint-disable-next-line no-console
    console.error('OwnerLayout: requireOwnerUser threw:', err);
    redirect('/');
  }

  if (!access || "error" in access) {
    if (access?.status === 401) {
      redirect("/");
    }

    redirect("/become-a-host");
  }

  return <>{children}</>;
}
