import { createFileRoute } from "@tanstack/react-router";
import { CreateSalonPage } from "@/components/salon/CreateSalonPage";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Create Your Salon — Barber Studio" },
      {
        name: "description",
        content:
          "Set up your salon profile, services, working hours and media to start accepting clients.",
      },
      { property: "og:title", content: "Create Your Salon" },
      {
        property: "og:description",
        content: "Premium onboarding to launch your barber salon.",
      },
    ],
  }),
});

function Index() {
  return <CreateSalonPage />;
}
