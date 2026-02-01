import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '447518521888'; // Relay WhatsApp (no + for wa.me)
const DEFAULT_MESSAGE = encodeURIComponent('Hey Relay! I want to get started');
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${DEFAULT_MESSAGE}`;

export function WhatsAppQR() {
  return (
    <motion.a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="inline-flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:border-green-200 transition-all group"
    >
      <div className="p-2 bg-white rounded-xl border border-slate-100 group-hover:border-green-100 transition-colors">
        <QRCodeSVG
          value={WHATSAPP_LINK}
          size={128}
          level="M"
          includeMargin={false}
          className="rounded-lg"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700 group-hover:text-green-700 transition-colors">
          Scan to open WhatsApp
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Opens chat with Relay
        </p>
      </div>
    </motion.a>
  );
}
