import { motion } from 'framer-motion';
import { ArrowRight, Twitter, Github, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative py-24 px-6 border-t border-slate-200 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
            Ready to simplify <span className="text-blue-600">crypto?</span>
          </h2>
          <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">
            Join the waitlist and be among the first to experience
            blockchain banking through conversation.
          </p>

          {/* Email signup */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:flex-1 bg-white border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
            />
            <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-black text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Join Waitlist
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            No spam. We'll only notify you when we launch.
          </p>
        </motion.div>

        {/* Footer links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h4 className="font-semibold text-sm mb-4 text-black">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#features" className="hover:text-black transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-black transition-colors">Demo</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-black">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-black transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-black transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-black">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-black transition-colors">About</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-black">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-black transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-black">Relay</span>
          </div>

          <p className="text-sm text-slate-400 mb-4 md:mb-0">
            © 2024 Relay. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Twitter className="w-4 h-4 text-slate-600" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Github className="w-4 h-4 text-slate-600" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <MessageCircle className="w-4 h-4 text-slate-600" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
