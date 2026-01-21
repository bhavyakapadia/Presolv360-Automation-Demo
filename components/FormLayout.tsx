
import React from 'react';
import { motion } from 'framer-motion';

interface FormLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const FormLayout: React.FC<FormLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#005082]">{title}</h2>
        <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );
};

export default FormLayout;
