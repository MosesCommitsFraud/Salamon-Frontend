import { motion } from 'framer-motion';
import Link from 'next/link';
import DynamicSvg  from '@/components/logoSvg'
import { MessageIcon, VercelIcon } from './icons';
import GlowingLogo from "@/components/logoSvg";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <GlowingLogo/>
        </p>
        <p>
         Ask the AI any thing u would like to it has a deep understanding about the rules as well as all Cards
        </p>
        <p>


        </p>
      </div>
    </motion.div>
  );
};
