"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  LogOut, 
  UserRound, 
  ChevronRight, 
  Settings, 
  PlusCircle,
  ImageIcon,
  MoreHorizontal,
  Trash2,
  Eye,
  Menu,
  X,
  PanelLeftOpen,
  Sparkles,
  Globe2,
  Zap,
  Radio,
  FileText
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationService, ChatSession } from '@/services/conversationService';
import { Database } from '@/types/supabase';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  // Add other fields if needed
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSessionId = searchParams.get('session');
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null }>({ display_name: null });
  
  // Use useMemo to ensure consistent reference
  const supabase = useMemo(() => getSupabaseClient(), []);
  const conversationService = useMemo(() => new ConversationService(currentSessionId || undefined), [currentSessionId]);

  const loadChatSessions = useCallback(async () => {
    try {
      const sessions = await conversationService.getChatSessions(7);
      const formattedSessions = sessions.map(session => ({
        ...session,
        timestamp: new Date(session.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        last_message: session.last_message?.length > 30 
          ? session.last_message.substring(0, 30) + '...'
          : session.last_message || 'New Conversation'
      }));
      setChatSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  }, [conversationService, toast]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single<Pick<UserProfile, 'display_name'>>();

        if (error) {
          const postgrestError = error as PostgrestError;
          console.error('Error fetching user profile:', postgrestError.message);
          return;
        }

        if (profile) {
          setUserProfile({ display_name: profile.display_name ?? null });
          if (user.email) {
            setUserEmail(user.email);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching user data:', error.message);
      } else {
        console.error('Unknown error fetching user data');
      }
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    loadChatSessions();
  }, [currentSessionId, loadChatSessions]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsCollapsed(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const handleChatUpdate = () => loadChatSessions();
    window.addEventListener('chat-updated', handleChatUpdate);
    return () => window.removeEventListener('chat-updated', handleChatUpdate);
  }, [loadChatSessions]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await conversationService.deleteChatSession(sessionId);
      setChatSessions(prev => prev.filter(session => session.session_id !== sessionId));
      
      if (currentSessionId === sessionId) {
        router.push('/chat');
      }

      toast({
        title: "Chat Deleted",
        description: "Chat history has been permanently deleted",
      });

      await loadChatSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat history",
        variant: "destructive",
      });
    }
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      router.push(`/chat?session=${sessionId}`);
      window.dispatchEvent(new CustomEvent('chat-updated'));
      
      toast({
        title: "Chat Loaded",
        description: "Previous conversation loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { 
      icon: MessageSquare, 
      label: 'AI Chat', 
      href: '/chat', 
      color: 'text-blue-400',
      description: 'Smart AI Chat Assistant'
    },
    { 
      icon: ImageIcon, 
      label: 'Imagine', 
      href: '/imagine', 
      color: 'text-indigo-400',
      description: 'AI Image Generation'
    },
    { 
      icon: FileText, 
      label: 'Document AI', 
      href: '/document', 
      color: 'text-emerald-400',
      description: 'Document Analysis & Chat'
    },
    { 
      icon: Globe2, 
      label: 'Lively', 
      href: '/lively', 
      color: 'text-emerald-400',
      description: 'Real-time AI with Grounding'
    },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear any local storage or state if needed
      localStorage.clear();
      
      // Show success toast
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });

      // Redirect to login page
      router.push("/login");
      router.refresh(); // Refresh to ensure auth state is updated
      
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && isCollapsed && (
        <motion.button
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 
            bg-white/80 backdrop-blur-xl rounded-2xl p-3
            shadow-lg border border-white/20
            hover:bg-white/90 transition-all duration-300
            hover:scale-110 active:scale-95
            hover:shadow-xl
            group"
          onClick={() => setIsCollapsed(false)}
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: -20 }}
        >
          <PanelLeftOpen className="h-6 w-6 text-gray-600 group-hover:text-gray-900 
            transition-all duration-300 group-hover:scale-110" />
        </motion.button>
      )}

      <motion.div 
        className={`fixed md:relative z-50 h-screen
          bg-gradient-to-b from-white/60 via-white/50 to-white/40
          backdrop-blur-2xl border border-white/20
          transition-all duration-300 ease-in-out
          flex flex-col overflow-hidden
          ${isCollapsed ? 'w-16' : 'w-[240px]'}
          shadow-[0_8px_32px_rgba(0,0,0,0.06)]
          hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
          md:rounded-[2.5rem] md:m-4 md:h-[calc(100vh-32px)]
          before:absolute before:inset-0 
          before:bg-gradient-to-br before:from-blue-100/20 before:via-purple-100/20 before:to-pink-100/20
          before:animate-gradient-xy before:opacity-60 before:-z-10
          ${isMobile ? 'h-full pb-safe-area-inset-bottom' : ''}`}
        initial={false}
        animate={{ 
          width: isCollapsed ? 64 : 240,
          x: isMobile && isCollapsed ? -240 : 0,
          height: isMobile ? '100%' : 'calc(100vh-32px)'
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center p-4 border-b border-white/20 backdrop-blur-sm bg-white/20">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
              <img 
                src="/assets/ai-icon.png" 
                alt="AI Icon" 
                className="w-9 h-9 rounded-2xl shadow-sm relative"
              />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h1 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 
                    bg-clip-text text-transparent"
                >
                  FeludaAI
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            variant="outline"
            className={`w-full justify-center gap-2.5 
              bg-gradient-to-r from-blue-500 to-purple-500 
              hover:from-blue-600 hover:to-purple-600 
              text-white border-0 
              shadow-lg hover:shadow-xl 
              transition-all duration-300 
              backdrop-blur-sm rounded-2xl
              ${isCollapsed ? 'p-2.5' : 'px-4 py-3'}`}
            onClick={() => router.push('/chat')}
          >
            <PlusCircle className="h-5 w-5" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium"
                >
                  New Chat
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col h-[calc(100%-140px)]">
          <div className="px-3 py-2 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                } gap-3 px-4 py-3 rounded-2xl transition-all duration-300 
                hover:bg-white/40 hover:shadow-md
                ${pathname === item.href
                  ? 'bg-white/50 text-gray-900 shadow-md'
                  : 'text-gray-700'}`}
                onClick={() => router.push(item.href)}
              >
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col items-start"
                    >
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px] group-hover:text-gray-900">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            ))}
          </div>

          {/* Chat History - Updated Section with Fixed Height */}
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3 border-t border-gray-200/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Recent Chats</span>
                {!isCollapsed && chatSessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => router.push('/chat')}
                  >
                    View All
                  </Button>
                )}
              </div>
            </div>
            <div className="h-[280px] overflow-y-auto scrollbar-thin scrollbar-track-transparent 
              scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 px-3 pb-2">
              <AnimatePresence>
                {chatSessions.map((session, index) => {
                  const colors = [
                    'text-blue-400',
                    'text-purple-400',
                    'text-pink-400',
                    'text-indigo-400',
                    'text-teal-400',
                    'text-cyan-400',
                    'text-green-400'
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <motion.div
                      key={session.session_id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mb-1.5"
                    >
                      <div className={`group relative p-2.5 rounded-xl 
                        hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/50
                        transition-all duration-300 cursor-pointer
                        hover:shadow-sm backdrop-blur-sm
                        ${session.session_id === currentSessionId ? 'bg-white/60 shadow-sm' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center space-x-2.5 flex-1"
                            onClick={() => handleViewSession(session.session_id)}
                          >
                            <div className={`p-2 rounded-xl bg-white/50 ${session.session_id === currentSessionId ? 'shadow-sm' : ''}`}>
                              <MessageSquare className={`h-4 w-4 ${colorClass} transition-transform duration-300 group-hover:scale-110`} />
                            </div>
                            {!isCollapsed && (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px] group-hover:text-gray-900">
                                  {session.last_message}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {session.message_count} messages • {session.timestamp}
                                </span>
                              </div>
                            )}
                          </div>
                          {!isCollapsed && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  onClick={() => handleViewSession(session.session_id)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteSession(session.session_id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* User Profile Section - Will now stay fixed at bottom */}
        <div className={`mt-auto border-t border-white/20 p-3 bg-white/10 backdrop-blur-sm
          ${isMobile ? 'pb-safe-area-inset-bottom' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full flex items-center gap-3 
                  hover:bg-white/40 rounded-2xl 
                  transition-all duration-300 justify-between
                  p-2 group`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-2xl ring-2 ring-white/50 group-hover:ring-blue-200 transition-all duration-300">
                    <AvatarImage src="/assets/pritam-img.png" className="rounded-2xl" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl">
                      <UserRound className="h-5 w-5 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-800">
                        {userProfile.display_name || 'Set display name'}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-[130px]">
                        {userEmail}
                      </span>
                    </div>
                  )}
                </div>
                {!isCollapsed && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 rounded-2xl bg-white/90 backdrop-blur-xl border-white/20
                shadow-lg animate-in fade-in-80 slide-in-from-top-1"
            >
              <DropdownMenuItem 
                onClick={() => router.push('/profile')}
                className="gap-2 text-gray-600 hover:text-gray-900"
              >
                <UserRound className="h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="gap-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Close Button */}
        {isMobile && (
          <motion.button
            className="absolute right-3 top-4
              bg-white/80 backdrop-blur-xl rounded-2xl p-2.5
              shadow-lg border border-white/20
              hover:bg-white/90 transition-colors duration-300
              group z-50"
            onClick={() => setIsCollapsed(true)}
            initial={false}
            animate={{ rotate: isCollapsed ? 0 : 180 }}
          >
            <X className="h-4 w-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
          </motion.button>
        )}
      </motion.div>
    </>
  );
}