'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { User } from '@supabase/supabase-js'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  UserRound, 
  Mail, 
  Save,
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Eye,
  Lock,
  Search,
  History,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationService, ChatSession } from '@/services/conversationService'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [conversationService] = useState(() => new ConversationService())
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    getProfile()
    loadChatSessions()
  }, [])

  const loadChatSessions = async () => {
    try {
      const sessions = await conversationService.getChatSessions(20) // Show more chat history
      setChatSessions(sessions)
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await conversationService.deleteChatSession(sessionId)
      setChatSessions(prev => prev.filter(session => session.session_id !== sessionId))
      toast({
        title: "Chat Deleted",
        description: "Chat history has been permanently deleted",
      })
      await loadChatSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "Error",
        description: "Failed to delete chat history",
        variant: "destructive",
      })
    }
  }

  const handleViewSession = async (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`)
  }

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setEmail(user.email || '')
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (profile) {
          setDisplayName(profile.display_name || '')
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      if (!user) return

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      
      window.dispatchEvent(new Event('profile-updated'))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      })

      // Reset password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsChangingPassword(false)
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/chat')}
        className="mb-6 hover:bg-gray-100/40 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
        Back to Chat
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings Section */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="bg-white/60 backdrop-blur-xl border-gray-200/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200/30">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src="/src/assets/pritam-img.png" />
                  <AvatarFallback>
                    <UserRound className="h-8 w-8 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <UserRound className="h-4 w-4 text-blue-500" />
                  Display Name
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-white/50 border-gray-200/50 focus:border-blue-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-purple-500" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50 border-gray-200/50"
                />
              </div>

              <Button
                onClick={() => updateProfile()}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-400 
                  hover:from-blue-500 hover:to-purple-500 text-white
                  transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="bg-white/60 backdrop-blur-xl border-gray-200/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-purple-500" />
                <div>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Update your password
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/50 border-gray-200/50"
                />
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/50 border-gray-200/50"
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/50 border-gray-200/50"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                variant="outline"
                className="w-full hover:bg-purple-50"
              >
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat History Section */}
        <div className="md:col-span-2">
          <Card className="bg-white/60 backdrop-blur-xl border-gray-200/30">
            <CardHeader className="border-b border-gray-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle>Chat History</CardTitle>
                    <CardDescription>
                      View and manage your conversation history
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{chatSessions.length} conversations</span>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="h-[600px] p-4">
              <div className="space-y-2 pr-4">
                <AnimatePresence>
                  {chatSessions.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No chat history found. Start a new conversation!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    chatSessions.map((session) => (
                      <motion.div
                        key={session.session_id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="group relative p-4 rounded-xl hover:bg-gray-100/40 
                          transition-all duration-200 border border-gray-200/30
                          hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-50 rounded-lg p-2">
                                <MessageSquare className="h-5 w-5 text-blue-400" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700 block mb-1">
                                  {session.last_message}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                                    {session.message_count} messages
                                  </span>
                                  <span>{formatDistanceToNow(new Date(session.timestamp))} ago</span>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  onClick={() => handleViewSession(session.session_id)}
                                  className="text-blue-600"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteSession(session.session_id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile