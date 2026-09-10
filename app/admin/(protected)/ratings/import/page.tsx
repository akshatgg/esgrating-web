import ClientRedirect from "@/components/admin/ClientRedirect";

// The ESG Rating List's CSV import moved under ESG Submissions.
export default function RatingsImportRedirect() {
  return <ClientRedirect to="/admin/esg/import" label="the ESG import" />;
}
