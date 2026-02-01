import { motion } from 'framer-motion';
import {
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Send,
  Receipt,
  Bell
} from 'lucide-react';

const features = [
  {
    icon: MessageSquareText,
    title: 'Explain',
    description: 'Understand any transaction in plain English. Just paste a hash or address.',
    example: '"What just happened to my wallet?"'
  },
  {
    icon: ShieldCheck,
    title: 'Verify',
    description: 'Check if an address is safe before interacting. Detect scams and risks.',
    example: '"Is this contract safe to approve?"'
  },
  {
    icon: Sparkles,
    title: 'Create',
    description: 'Deploy smart contracts from natural language. No coding required.',
    example: '"Create a token called RELAY"'
  },
  {
    icon: Send,
    title: 'Send',
    description: 'Transfer funds with simple commands. Supports ENS and address validation.',
    example: '"Send 0.5 ETH to vitalik.eth"'
  },
  {
    icon: Receipt,
    title: 'Proof',
    description: 'Generate shareable receipts for any transaction. Perfect for records.',
    example: '"Show me a receipt for this tx"'
  },
  {
    icon: Bell,
    title: 'Safety',
    description: 'Proactive alerts for suspicious activity. Your 24/7 security guard.',
    example: '"Alert me if anything weird happens"'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function Features() {
  return (
    <section id="features" className="relative py-32 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
            Six modes. <span className="text-blue-600">Infinite possibilities.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            From explaining complex DeFi transactions to deploying smart contracts,
            Relay handles it all through natural conversation.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 text-black">{feature.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{feature.description}</p>

              {/* Example */}
              <div className="text-xs text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded-lg">
                {feature.example}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-slate-400 mb-4">And many more features coming soon...</p>
          <a href="#demo" className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium">
            See it in action →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
