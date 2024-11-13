"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnimatedSections() {
  return (
    <>
      <div className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 
            to-purple-600 bg-clip-text text-transparent leading-tight">
            Your AI Assistant for
            <br />
            Smarter Conversations
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the next generation of AI-powered conversations. Bohurupi AI adapts to your needs,
            learns from context, and delivers intelligent responses.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 
              hover:from-blue-700 hover:to-purple-700 text-white">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Smart Responses</h3>
          <p className="text-muted-foreground">
            Advanced AI that understands context and provides intelligent, relevant responses.
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300">
          <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p className="text-muted-foreground">
            Get instant responses powered by cutting-edge AI technology.
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
          <p className="text-muted-foreground">
            Your conversations are encrypted and protected with enterprise-grade security.
          </p>
        </div>
      </motion.div>
    </>
  );
} 