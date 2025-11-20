import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

export function CTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-card via-background to-card relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--cockpit-cyan)] to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--cockpit-purple)] to-transparent"
          animate={{
            x: ['100%', '-100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border mb-8">
            <Sparkles className="w-4 h-4 text-[var(--cockpit-purple)]" />
            <span className="text-sm">Ready to Launch</span>
          </div>

          <h2 className="text-4xl md:text-6xl mb-6">
            Start Reviewing <span className="text-[var(--cockpit-cyan)]">Smarter</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the future of code review. Get instant, AI-powered insights for every change you make.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] hover:opacity-90 text-background shadow-lg shadow-[var(--cockpit-cyan-glow)]">
                Open Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button size="lg" variant="outline" className="border-border hover:bg-accent">
                View Settings
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
