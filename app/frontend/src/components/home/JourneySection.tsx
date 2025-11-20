import { motion } from 'motion/react';
import { FileCode, Cpu, Eye, MessageSquare } from 'lucide-react';

const journeySteps = [
  {
    icon: <FileCode className="w-8 h-8" />,
    title: 'Submit Your Code',
    description: 'Upload a diff manually or connect a GitHub PR. Our system accepts changes of any size.',
    color: 'cyan'
  },
  {
    icon: <Cpu className="w-8 h-8" />,
    title: 'Pipeline Orchestration',
    description: 'Multiple specialized AI agents analyze your code in parallel - security, performance, style, and more.',
    color: 'purple'
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: 'Deep Inspection',
    description: 'Each agent examines your code through its lens, categorizing issues by severity and providing context.',
    color: 'green'
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'Actionable Insights',
    description: 'Receive organized feedback with suggested fixes, line-by-line comments, and sync to GitHub if needed.',
    color: 'yellow'
  }
];

const colorMap: Record<string, string> = {
  cyan: 'var(--cockpit-cyan)',
  purple: 'var(--cockpit-purple)',
  green: 'var(--cockpit-green)',
  yellow: 'var(--cockpit-yellow)',
};

export function JourneySection() {
  return (
    <section className="py-24 px-6 bg-card relative overflow-hidden">
      {/* Diagonal Background Lines */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-[var(--cockpit-cyan)]"
            style={{
              width: '200%',
              top: `${i * 5}%`,
              left: '-50%',
              transform: 'rotate(-15deg)'
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl mb-4">
            How It <span className="text-[var(--cockpit-cyan)]">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From diff to insights in four seamless steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden md:block absolute top-0 left-0 w-full h-full">
            <svg className="w-full h-full" style={{ position: 'absolute' }}>
              {journeySteps.map((_, i) => {
                if (i === journeySteps.length - 1) return null;
                const y = 150 + i * 320;
                return (
                  <motion.line
                    key={i}
                    x1="50%"
                    y1={y}
                    x2="50%"
                    y2={y + 200}
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: i * 0.3 }}
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--cockpit-cyan)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--cockpit-purple)" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Steps */}
          <div className="space-y-16 md:space-y-24">
            {journeySteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${colorMap[step.color]}20`,
                        border: `2px solid ${colorMap[step.color]}`,
                        boxShadow: `0 0 20px ${colorMap[step.color]}40`
                      }}
                    >
                      <div style={{ color: colorMap[step.color] }}>
                        {step.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-sm px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: `${colorMap[step.color]}20`,
                            color: colorMap[step.color]
                          }}
                        >
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="text-2xl mb-3">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <div
                    className="p-6 rounded-xl border-2 backdrop-blur-sm"
                    style={{
                      borderColor: `${colorMap[step.color]}40`,
                      backgroundColor: `${colorMap[step.color]}05`
                    }}
                  >
                    <div className="space-y-2 font-mono text-sm">
                      {step.color === 'cyan' && (
                        <>
                          <div className="text-muted-foreground">$ git diff HEAD~1</div>
                          <div className="text-[var(--cockpit-green)]">+ const review = await submit(diff);</div>
                          <div className="text-[var(--cockpit-cyan)]">Uploading changes...</div>
                        </>
                      )}
                      {step.color === 'purple' && (
                        <>
                          <div className="text-muted-foreground">[Pipeline] Initializing agents...</div>
                          <div className="text-[var(--cockpit-purple)]">✓ Security Agent: Ready</div>
                          <div className="text-[var(--cockpit-purple)]">✓ Performance Agent: Ready</div>
                          <div className="text-[var(--cockpit-purple)]">✓ Style Agent: Ready</div>
                        </>
                      )}
                      {step.color === 'green' && (
                        <>
                          <div className="text-[var(--cockpit-yellow)]">⚠ Potential SQL injection detected</div>
                          <div className="text-[var(--cockpit-cyan)]">ℹ Consider using async/await</div>
                          <div className="text-[var(--cockpit-green)]">✓ Code style compliant</div>
                        </>
                      )}
                      {step.color === 'yellow' && (
                        <>
                          <div className="text-[var(--cockpit-green)]">Review complete: 12 comments</div>
                          <div className="text-muted-foreground">Severity: 3 critical, 5 warnings</div>
                          <div className="text-[var(--cockpit-cyan)]">Syncing to GitHub...</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
