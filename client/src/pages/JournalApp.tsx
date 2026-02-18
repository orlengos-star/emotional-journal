import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ClientJournalView from "@/components/ClientJournalView";
import TherapistJournalView from "@/components/TherapistJournalView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import SettingsPanel from "@/components/SettingsPanel";
import { Loader2 } from "lucide-react";

export default function JournalApp() {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"client" | "therapist">("client");

  const { data: therapists, isLoading: therapistsLoading } =
    trpc.relationship.getMyTherapists.useQuery();
  const { data: clients, isLoading: clientsLoading } =
    trpc.relationship.getMyClients.useQuery();

  const isTherapist = clients && clients.length > 0;

  useEffect(() => {
    if (isTherapist && activeTab === "client") {
      setActiveTab("therapist");
    }
  }, [isTherapist, activeTab]);

  if (therapistsLoading || clientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Emotional Journal
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.name || "Welcome"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isTherapist ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "client" | "therapist")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="client">My Journal</TabsTrigger>
              <TabsTrigger value="therapist">My Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <ClientJournalView />
            </TabsContent>

            <TabsContent value="therapist">
              <TherapistJournalView />
            </TabsContent>
          </Tabs>
        ) : (
          <ClientJournalView />
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
