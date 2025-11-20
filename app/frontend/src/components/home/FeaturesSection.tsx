import { motion } from 'motion/react';
import { Shield, Gauge, Sparkles, GitBranch, Target, Layers } from 'lucide-react';

const features = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Security Analysis',
    description: 'Detect vulnerabilities, injection risks, and security anti-patterns before they reach production.',
    gradient: 'from-[var(--cockpit-red)] to-[var(--cockpit-yellow)]'
  },
  {
    icon: <Gauge className="w-6 h-6" />,
    title: 'Performance Insights',
    description: 'Identify bottlenecks, inefficient algorithms, and optimization opportunities automatically.',
    gradient: 'from-[var(--cockpit-cyan)] to-[var(--cockpit-green)]'
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Code Quality',
    description: 'Enforce best practices, maintainability standards, and clean code principles.',
    gradient: 'from-[var(--cockpit-purple)] to-[var(--cockpit-cyan)]'
  },
  {
    icon: <GitBranch className="w-6 h-6" />,
    title: 'GitHub Sync',
    description: 'Comments automatically appear on your PRs. Seamless integration with your workflow.',
    gradient: 'from-[var(--cockpit-green)] to-[var(--cockpit-cyan)]'
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Precise Context',
    description: 'Line-by-line feedback with exact locations, severity levels, and suggested fixes.',
    gradient: 'from-[var(--cockpit-yellow)] to-[var(--cockpit-red)]'
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'Multi-Agent Pipeline',
    description: 'Parallel processing with specialized agents for comprehensive analysis.',
    gradient: 'from-[var(--cockpit-purple)] to-[var(--cockpit-purple)]'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-background relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl mb-4">
            Powered by <span className="text-[var(--cockpit-purple)]">Intelligence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive analysis across multiple dimensions of code quality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 rounded-xl bg-card border border-border hover:border-transparent transition-all duration-300 h-full">
                {/* Gradient border on hover */}
                <div 
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                  style={{ padding: '2px' }}
                >
                  <div className="w-full h-full bg-card rounded-xl" />
                </div>

                <div 
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <div className="text-background">
                    {feature.icon}
                  </div>
                </div>

                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
