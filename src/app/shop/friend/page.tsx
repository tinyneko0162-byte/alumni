import { redirect } from "next/navigation";

/** Friend details are now filled in on the shop page itself. */
export default function FriendPage() {
  redirect("/shop");
}
