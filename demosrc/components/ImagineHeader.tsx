'use client'

import * as React from "react"
import { Bell, Grid, Image, LayoutGrid, Sparkles } from "lucide-react"
import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export default function ImagineHeader() {
  return (
    <header className="h-12 sm:h-14 md:h-16 bg-white/80 backdrop-blur-xl
        border border-gray-200/30 
        flex items-center justify-between 
        px-3 sm:px-4 md:px-6
        rounded-2xl sm:rounded-[24px] md:rounded-[32px]
        shadow-[0_8px_40px_rgba(0,0,0,0.08)] 
        hover:shadow-[0_8px_50px_rgba(0,0,0,0.12)]
        transition-all duration-300"
      >
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
            <Sparkles className="absolute inset-1 text-white" />
          </div>
          <span className="text-xl font-semibold">Imagine</span>
        </Link>

        
      </div>

      <div className="flex items-center gap-4">
       
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Grid className="size-4" />
          </Button>
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="size-4" />
        </Button>
        <Avatar>
          <AvatarImage src="/assets/ai-icon.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
} 