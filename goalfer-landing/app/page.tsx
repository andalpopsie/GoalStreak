import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Target, TrendingUp, Star, Zap, Calendar, Award, Smartphone } from "lucide-react"

export default function GoalStreakLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GoalStreak</span>
          </div>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 bg-accent/10 text-accent-foreground border-accent/20">
            🎯 Build Better Habits Together
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-balance mb-6 text-foreground">
            Build Your Habits, <span className="text-primary">Celebrate Your Progress!</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto leading-relaxed">
            Transform your life with visual streak tracking, accountability partners, and a supportive community. Make
            habit building fun, social, and rewarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="https://apps.apple.com/app/goalstreak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/download-on-the-app-store-button-black.jpg"
                alt="Download on the App Store"
                className="h-[56px] w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.goalstreak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/get-it-on-google-play-button.png"
                alt="Get it on Google Play"
                className="h-[56px] w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              Start Your Streak Today
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent">
              Watch Demo
            </Button>
          </div>

          {/* App Mockup */}
          <div className="relative max-w-sm mx-auto">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl">
              <div className="bg-primary/10 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Daily Reading</span>
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    7 Day Streak! 🔥
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Morning Workout</span>
                  <span className="text-accent font-medium">3 days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meditation</span>
                  <span className="text-accent font-medium">12 days</span>
                </div>
              </div>
            </div>
          </div>
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

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Join Thousands Building Better Habits
            </h2>
            <p className="text-lg text-muted-foreground">
              See how GoalStreak has transformed lives and helped people achieve their goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4">
                  "GoalStreak helped me build a consistent reading habit. The visual streaks are so motivating, and my
                  accountability partner keeps me on track. I've read 24 books this year!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">Sarah Martinez</p>
                    <p className="text-sm text-muted-foreground">Marketing Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4">
                  "The group challenges feature is amazing! I joined a fitness challenge with my coworkers and we've all
                  been more active. It's like having a personal trainer and cheerleader in one app."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-accent font-semibold">MJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">Michael Johnson</p>
                    <p className="text-sm text-muted-foreground">Software Developer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4">
                  "I love how I can share my progress with friends and family. The progress cards are beautiful and it
                  feels great to celebrate small wins. My meditation streak is now 45 days!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">EC</span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">Emily Chen</p>
                    <p className="text-sm text-muted-foreground">Yoga Instructor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4">
                  "The smart reminders are perfectly timed and never feel pushy. GoalStreak helped me establish a
                  morning routine that's stuck for over 6 months now. Life-changing!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-accent font-semibold">DW</span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">David Wilson</p>
                    <p className="text-sm text-muted-foreground">Entrepreneur</p>
                  </div>
                </div>
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
            Join thousands of people who are already transforming their lives with GoalStreak. Start your journey today
            and see the difference consistency makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href="https://apps.apple.com/app/goalstreak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/download-on-the-app-store-button-black.jpg"
                alt="Download on the App Store"
                className="h-[56px] w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.goalstreak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/get-it-on-google-play-button.png"
                alt="Get it on Google Play"
                className="h-[56px] w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              <Smartphone className="w-5 h-5 mr-2" />
              Download Now - It's Free
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent">
              Join the Waitlist
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Available on iOS and Android • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">GoalStreak</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 GoalStreak. All rights reserved. Built with ❤️ for habit builders everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}
