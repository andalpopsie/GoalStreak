import { IoCheckmarkCircle, IoPeople, IoBarChart, IoNotifications, IoPhonePortrait, IoTrophy } from 'react-icons/io5'

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Build Lasting Habits with GoalStreak</h1>
            <p>
              Transform your life with the ultimate habit tracking app. 
              Build streaks, connect with friends, and achieve your goals together.
            </p>
            <a href="#download" className="cta-button">
              Download Now
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px', color: '#333' }}>
            Why Choose GoalStreak?
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginBottom: '60px' }}>
            Everything you need to build and maintain life-changing habits
          </p>
          
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon"><IoCheckmarkCircle size={48} color="#4635B1" /></div>
              <h3>Smart Habit Tracking</h3>
              <p>
                Track your daily habits with intuitive timers, progress rings, 
                and streak counters that keep you motivated.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon"><IoPeople size={48} color="#4635B1" /></div>
              <h3>Social Accountability</h3>
              <p>
                Connect with friends, share your progress, and stay accountable 
                together. See real-time updates and celebrate wins.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon"><IoBarChart size={48} color="#4635B1" /></div>
              <h3>Detailed Analytics</h3>
              <p>
                Understand your patterns with comprehensive analytics, 
                weekly reports, and insights that help you improve.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon"><IoNotifications size={48} color="#4635B1" /></div>
              <h3>Smart Reminders</h3>
              <p>
                Never miss a habit with intelligent notifications that adapt 
                to your schedule and preferences.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon"><IoPhonePortrait size={48} color="#4635B1" /></div>
              <h3>Beautiful Design</h3>
              <p>
                Enjoy a clean, intuitive interface designed for daily use. 
                Available on iOS with seamless synchronization.
              </p>
            </div>
            
            <div className="feature">
              <div className="feature-icon"><IoTrophy size={48} color="#4635B1" /></div>
              <h3>Achievement System</h3>
              <p>
                Unlock achievements, build impressive streaks, and track 
                your journey to becoming your best self.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" style={{ 
        padding: '80px 0', 
        background: 'linear-gradient(135deg, #B771E5 0%, #4635B1 100%)',
        textAlign: 'center',
        color: 'white'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
            Ready to Start Your Journey?
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>
            Join thousands of users who are already building better habits with GoalStreak
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="#" 
              className="cta-button"
              style={{ background: '#AEEA94', color: '#4635B1', border: '2px solid #AEEA94' }}
            >
              📱 Download for iOS
            </a>
            <a 
              href="#" 
              className="cta-button"
              style={{ background: 'transparent', color: '#AEEA94', border: '2px solid #AEEA94' }}
            >
              🤖 Coming to Android
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: '#333', 
        color: 'white', 
        padding: '40px 0', 
        textAlign: 'center' 
      }}>
        <div className="container">
          <p>&copy; 2025 GoalStreak. Built with ❤️ for habit builders everywhere.</p>
        </div>
      </footer>
    </main>
  )
}
