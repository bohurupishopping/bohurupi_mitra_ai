"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Sparkles, Zap, Brain, Command, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: Sparkles,
    title: "Context-Aware AI",
    description: "Our advanced AI understands context deeply, providing human-like responses tailored to your conversations.",
    color: "blue"
  },
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "Bohurupi learns from each interaction, becoming more personalized to your communication style.",
    color: "purple"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience real-time responses with our optimized AI processing capabilities.",
    color: "yellow"
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-grade encryption and privacy measures to keep your conversations completely secure.",
    color: "green"
  },
  {
    icon: Command,
    title: "Powerful Integration",
    description: "Seamlessly integrate with your favorite tools and workflows for enhanced productivity.",
    color: "pink"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data belongs to you. We never store or share your sensitive information.",
    color: "orange"
  }
];

export function AnimatedSections() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <motion.div 
        className="text-center space-y-8"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div
          variants={fadeInUp}
          className="space-y-6"
        >
          <div className="inline-block">
            <motion.span
              className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Introducing Bohurupi AI 2.0
            </motion.span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Your Intelligent
            <br />
            AI Companion
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your conversations with AI that truly understands you. Bohurupi AI combines
            cutting-edge language processing with intuitive learning to deliver an unmatched conversational experience.
          </p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 py-6 text-lg
              shadow-lg hover:shadow-xl transition-all duration-300">
              Start Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group p-8 rounded-3xl border bg-card/50 backdrop-blur-sm 
              hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`h-14 w-14 rounded-2xl bg-${feature.color}-500/10 flex items-center 
              justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className={`h-7 w-7 text-${feature.color}-600`} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-24 text-center"
      >
     
      </motion.div>
    </div>
  );
} 