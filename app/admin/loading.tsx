import Loader from "@/components/ui/Loader";

/** Full screen while the admin guard checks the session (e.g. right after login). */
export default function AdminLoading() {
  return <Loader className="min-h-screen bg-bg-soft px-4" />;
}
