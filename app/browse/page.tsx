import BrowseClient from "./BrowseCars";
import { getCars } from "@/components/app/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Cars - Qent",
  description: "Browse and rent premium cars with Qent.",
};

export default async function Page() {
  const cars = await getCars();
  return <BrowseClient cars={cars} />;
}