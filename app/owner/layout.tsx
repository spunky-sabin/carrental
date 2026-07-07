import { redirect } from "next/navigation";
import { requireOwnerUser } from "@/lib/owner";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    if (access.status === 401) {
      redirect("/");
    }

    redirect("/become-a-host");
  }

  return <>{children}</>;
}
