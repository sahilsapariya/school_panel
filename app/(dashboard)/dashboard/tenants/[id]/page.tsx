import { TenantDetailView } from "./tenant-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TenantDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (searchParams) await searchParams; // consume so Next.js doesn't enumerate as Promise
  return <TenantDetailView id={id} />;
}
