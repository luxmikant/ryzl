import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Github, FileCode } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'motion/react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-card">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, var(--cockpit-cyan) 1px, transparent 1px),
            linear-gradient(to bottom, var(--cockpit-cyan) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 rounded-full bg-[var(--cockpit-cyan)] opacity-10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[var(--cockpit-purple)] opacity-10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.1, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border mb-8">
            <Zap className="w-4 h-4 text-[var(--cockpit-cyan)]" />
            <span className="text-sm text-muted-foreground">AI-Powered Code Analysis</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-[var(--cockpit-cyan)] via-[var(--cockpit-purple)] to-[var(--cockpit-cyan)] bg-clip-text text-transparent"
        >
          Code Review Cockpit
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
        >
          Your mission control center for intelligent code reviews. Leveraging AI agents to analyze diffs, detect issues, and provide actionable feedback in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link to="/submit/manual">
            <Button size="lg" className="bg-[var(--cockpit-cyan)] hover:bg-[var(--cockpit-cyan)]/80 text-background shadow-lg shadow-[var(--cockpit-cyan-glow)]">
              <FileCode className="w-5 h-5 mr-2" />
              Review a Diff
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/submit/github">
            <Button size="lg" variant="outline" className="border-[var(--cockpit-purple)] text-[var(--cockpit-purple)] hover:bg-[var(--cockpit-purple)]/10">
              <Github className="w-5 h-5 mr-2" />
              Review GitHub PR
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            {
              icon: <Zap className="w-8 h-8 text-[var(--cockpit-cyan)]" />,
              title: 'Instant Analysis',
              description: 'Multi-agent pipeline processes your code in parallel for rapid insights'
            },
            {
              icon: <Github className="w-8 h-8 text-[var(--cockpit-purple)]" />,
              title: 'GitHub Integration',
              description: 'Seamlessly review PRs and sync comments directly to your repository'
            },
            {
              icon: <FileCode className="w-8 h-8 text-[var(--cockpit-green)]" />,
              title: 'Deep Inspection',
              description: 'Security, performance, style, and best practice analysis in one place'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
              className="p-6 rounded-xl bg-card border border-border hover:border-[var(--cockpit-cyan)]/50 transition-all duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
