import { redirect } from "next/navigation";

export default function SettingsPage() {
  // Settings are managed inline on the account page now.
  redirect("/account");
}
