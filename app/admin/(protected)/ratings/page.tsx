import ClientRedirect from "@/components/admin/ClientRedirect";
import { RATED_COMPANIES_HREF } from "@/lib/admin-nav";

// The ESG Rating List moved into ESG Submissions (the "Rating list" filter).
export default function RatingsRedirect() {
  return <ClientRedirect to={RATED_COMPANIES_HREF} label="ESG Submissions" />;
}
