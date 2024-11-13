"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        toast.success("Welcome to Bohurupi AI!", {
          description: "Successfully signed in to your account"
        });
        router.push("/chat");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-[url('/assets/ai.png')] opacity-[0.02]"
        />
        <div className="absolute inset-0 backdrop-blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full z-10">
        {/* Header */}
        <header className="w-full py-4 px-4 sm:px-6 flex justify-center items-center 
          border-b border-white/20 backdrop-blur-xl bg-white/40">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 
                rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <img 
                src="/assets/ai-icon.png" 
                alt="Bohurupi AI" 
                className="w-9 h-9 rounded-xl shadow-sm relative"
              />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 
              bg-clip-text text-transparent">
              Bohurupi AI
            </span>
          </motion.div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Welcome Text */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                  bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-sm text-gray-600">
                  Sign in to continue to your account
                </p>
              </div>

              {/* Login Card */}
              <div className="bg-white/60 backdrop-blur-xl border-white/20 
                shadow-[0_8px_40px_rgba(0,0,0,0.08)] 
                hover:shadow-[0_8px_50px_rgba(0,0,0,0.12)]
                transition-all duration-300
                rounded-2xl overflow-hidden p-4 sm:p-6">
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#4F46E5',
                          brandAccent: '#4338CA',
                        },
                      },
                    },
                    className: {
                      container: 'w-full space-y-4',
                      button: `w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-300
                        hover:opacity-90 flex items-center justify-center gap-2 
                        bg-gradient-to-r from-blue-600 to-purple-600 
                        hover:from-blue-700 hover:to-purple-700
                        text-white shadow-lg hover:shadow-xl
                        transform hover:scale-[1.02] active:scale-[0.98]`,
                      label: 'text-sm font-medium text-gray-700',
                      input: `w-full px-4 py-2.5 rounded-xl border border-gray-200/50
                        focus:ring-2 focus:ring-blue-100 focus:border-blue-500 
                        transition-all duration-300
                        bg-white/50 backdrop-blur-sm
                        text-sm`,
                      loader: 'animate-spin',
                      anchor: 'text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200',
                      divider: 'bg-gray-200/50',
                      message: 'text-sm text-gray-600 rounded-lg bg-gray-50/80 p-3',
                    },
                  }}
                  providers={["google", "github"]}
                  redirectTo={`${window.location.origin}/chat`}
                  magicLink={true}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-4 px-6 text-center text-xs text-gray-500 
          border-t border-white/20 bg-white/40 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4"
          >
            <span>© 2024 Bohurupi AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-blue-600 transition-colors duration-200">Privacy</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" className="hover:text-blue-600 transition-colors duration-200">Terms</a>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
} 