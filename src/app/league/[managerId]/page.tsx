import { notFound } from "next/navigation";
import { ManagerDetailClient } from "@/components/league/ManagerDetailClient";
import { getCurrentUserId, getManagerGameweekReview } from "@/lib/data";

interface Props {
  params: Promise<{ managerId: string }>;
}

export default async function ManagerDetailPage({ params }: Props) {
  const { managerId } = await params;
  const currentUserId = await getCurrentUserId();
  const review = await getManagerGameweekReview(managerId, { currentUserId });

  if (!review) {
    notFound();
  }

  return <ManagerDetailClient review={review} />;
}
