import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null }>({ display_name: null });

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserEmail(session?.user?.email || null)
    }
    getUserEmail()
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('user_id', session.user.id)
            .maybeSingle()
          
          if (profile) {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setUserProfile({ display_name: null })
      }
    }

    getProfile()
    window.addEventListener('profile-updated', getProfile)
    return () => window.removeEventListener('profile-updated', getProfile)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "Successfully signed out of your account",
    })
    navigate("/login")
  }

  return (
    <div className="sticky top-0 z-20 px-2 sm:px-4 pt-2 sm:pt-4">
      <header className="h-12 sm:h-14 md:h-16 bg-white/80 backdrop-blur-xl
        border border-gray-200/30 
        flex items-center justify-between 
        px-3 sm:px-4 md:px-6
        rounded-2xl sm:rounded-[24px] md:rounded-[32px]
        shadow-[0_8px_40px_rgba(0,0,0,0.08)] 
        hover:shadow-[0_8px_50px_rgba(0,0,0,0.12)]
        transition-all duration-300"
      >
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-gray-100/50 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </Button>
          )}
          <h1 className="text-base sm:text-lg md:text-xl font-bold 
            bg-gradient-to-r from-blue-600 to-purple-600 
            bg-clip-text text-transparent
            whitespace-nowrap"
          >
            {title}
          </h1>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="block sm:hidden">
            
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 sm:h-9 sm:w-9 p-0
                  hover:bg-gray-100/40 
                  rounded-xl
                  transition-all duration-200"
              >
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 
                  ring-2 ring-purple-100 
                  transition-all duration-200
                  hover:ring-purple-200
                  rounded-xl"
                >
                  <AvatarImage src="/assets/pritam-img.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                    <UserRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 sm:w-56 rounded-xl 
                bg-white/90 backdrop-blur-xl border-gray-200/30
                shadow-[0_8px_40px_rgba(0,0,0,0.12)]
                animate-in fade-in-0 zoom-in-95
                mt-1"
            >
              <DropdownMenuLabel className="font-normal px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile.display_name || 'Set display name'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200/50" />
              <div className="px-1 py-1">
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')}
                  className="gap-2 text-gray-600 hover:text-gray-900 rounded-lg px-2 py-1.5"
                >
                  <UserRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-sm">Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')}
                  className="gap-2 text-gray-600 hover:text-gray-900 rounded-lg px-2 py-1.5"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-sm">Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-gray-200/50" />
              <div className="px-1 py-1">
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="gap-2 text-red-600 hover:text-red-700 focus:text-red-700 rounded-lg px-2 py-1.5"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
};

export default Header;