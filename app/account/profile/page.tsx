import { redirect } from "next/navigation";

export default function ProfilePage() {
  // Profile is managed inline on the account settings page now.
  redirect("/account");
}
