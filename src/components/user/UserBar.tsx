import { logoutUser } from "@/lib/actions";

/** Who is signed in on the attendee pages, with a sign-out button. */
export function UserBar({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 pb-1 text-[12px] leading-[1.55] text-black">
      <span className="truncate">เข้าสู่ระบบเป็น {name}</span>
      <form action={logoutUser}>
        <button type="submit" className="shrink-0 font-semibold text-brand-deep hover:underline">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
