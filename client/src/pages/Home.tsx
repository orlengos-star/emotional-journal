import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Heart, Users, Bell, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Emotional Journal
          </h1>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Your Safe Space for Reflection
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          A therapy-friendly journaling app that connects you with your therapist.
          Write freely, rate your days, and build meaningful therapeutic relationships.
        </p>
        <Button
          size="lg"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          Get Started
        </Button>
      </section>

      {/* Features Section */}
      <section className="bg-card border-t border-b border-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-foreground mb-12 text-center">
            Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-foreground mb-2">
                Daily Journaling
              </h4>
              <p className="text-sm text-muted-foreground">
                Write your thoughts and feelings with ease. Your entries are always private.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-foreground mb-2">
                Therapist Connection
              </h4>
              <p className="text-sm text-muted-foreground">
                Invite your therapist to view your entries and provide support.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Bell className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-foreground mb-2">
                Smart Reminders
              </h4>
              <p className="text-sm text-muted-foreground">
                Get gentle reminders to journal and track your emotional patterns.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h4 className="font-semibold text-foreground mb-2">
                Privacy First
              </h4>
              <p className="text-sm text-muted-foreground">
                Your data is encrypted and only shared with people you invite.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-foreground mb-12 text-center">
          How It Works
        </h3>
        <div className="space-y-8">
          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Write Freely
              </h4>
              <p className="text-muted-foreground">
                Use the Telegram bot or web app to journal your thoughts. You can write as much or as little as you want.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Rate Your Days
              </h4>
              <p className="text-muted-foreground">
                On a scale of negative to positive, rate how your day went. Track your emotional patterns over time.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Connect with Therapist
              </h4>
              <p className="text-muted-foreground">
                Invite your therapist to view your entries. They can add private notes to support your therapy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of people using Emotional Journal for therapy support.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Emotional Journal. All rights reserved.</p>
          <p className="mt-2">
            A therapy-friendly space for reflection and connection.
          </p>
        </div>
      </footer>
    </div>
  );
}
