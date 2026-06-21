import { listFulfillmentQueue } from "@/server/services/dispatch";
import { FulfillmentQueue } from "@/components/admin/fulfillment/fulfillment-queue";

export const dynamic = "force-dynamic";

export default async function FulfillmentPage() {
  const { ready, inTransit } = await listFulfillmentQueue();
  return <FulfillmentQueue ready={ready} inTransit={inTransit} />;
}
