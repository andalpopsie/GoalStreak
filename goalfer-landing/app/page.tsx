import { Card, CardContent } from "@/components/ui/card"
import { Users, TrendingUp, Star, Zap, Calendar, Award } from "lucide-react"
import { WaitlistForm } from "@/components/waitlist-form"
import { AppStoreButton } from "@/components/app-store-button"

export default function GoalferLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Goalfer" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-foreground">Goalfer</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          {/* Eyebrow */}
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Now on iOS
          </p>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6 leading-[1.05] text-foreground">
            Build habits that
            <br />
            <span className="text-primary">actually stick.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-10 text-pretty max-w-2xl mx-auto leading-relaxed">
            Goalfer is the social habit tracker that helps you build lasting routines through visual
            streaks, accountability partners, and a supportive community.
          </p>

          {/* Waitlist form — prominent, right under the subheader */}
          <div className="mb-8">
            <WaitlistForm />
          </div>

          {/* Prominent App Store download */}
          <div className="flex justify-center">
            <AppStoreButton />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Available now on iOS · Android coming soon
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Everything You Need to Build Lasting Habits
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our app combines proven habit-building techniques with social motivation to help you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Visual Streak Tracking</h3>
                <p className="text-muted-foreground">
                  See your progress with beautiful visual streaks that motivate you to keep going every day.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Accountability Partners</h3>
                <p className="text-muted-foreground">
                  Connect with friends and family who support your journey and keep you accountable.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Smart Reminders</h3>
                <p className="text-muted-foreground">
                  Gentle, personalized reminders that adapt to your schedule and preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Group Challenges</h3>
                <p className="text-muted-foreground">
                  Join community challenges and compete with others to stay motivated and engaged.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Progress Sharing</h3>
                <p className="text-muted-foreground">
                  Share beautiful progress cards with your network and celebrate your wins together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Motivational Boosts</h3>
                <p className="text-muted-foreground">
                  Receive encouraging messages and celebrate milestones to keep your motivation high.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready to Build Your Best Habits?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start building better habits with Goalfer. Begin your journey today
            and see the difference consistency makes.
          </p>
          <div className="flex justify-center mb-4">
            <AppStoreButton />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Available now on iOS • Android coming soon • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/logo.png" alt="Goalfer" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-foreground">Goalfer</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="hover:text-foreground transition-colors">
                Support
              </a>
              <a href="mailto:hello@goalfer.app" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 Evangeline Andal. All rights reserved. Built with ❤️ for habit builders everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}
