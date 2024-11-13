"use client";

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SizeSelectorProps {
  onSizeChange: (size: string) => void;
}

export default function SizeSelector({ onSizeChange }: SizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState('1024x1024');

  const sizes = [
    {
      id: '1024x1024',
      name: 'Square',
      description: '1024x1024',
    },
    {
      id: '1024x1792',
      name: 'Portrait',
      description: '1024x1792',
    },
    {
      id: '1792x1024',
      name: 'Landscape',
      description: '1792x1024',
    },
  ];

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSize(sizeId);
    onSizeChange(sizeId);
  };

  const selectedSizeData = sizes.find(size => size.id === selectedSize);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-2 
            bg-white/10 backdrop-blur-md border border-white/20
            hover:bg-white/20 transition-all duration-300
            rounded-xl text-sm font-medium text-gray-700"
        >
          <span className="text-sm font-medium">{selectedSizeData?.name}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-xl bg-white/90 backdrop-blur-xl
          border-white/20 shadow-lg"
      >
        {sizes.map((size) => (
          <DropdownMenuItem
            key={size.id}
            onClick={() => handleSizeSelect(size.id)}
            className="flex items-center justify-between px-3 py-2
              text-sm cursor-pointer hover:bg-gray-100/50
              transition-colors duration-200"
          >
            <div className="flex flex-col">
              <span className="font-medium">{size.name}</span>
              <span className="text-xs text-gray-500">{size.description}</span>
            </div>
            {selectedSize === size.id && (
              <Check className="h-4 w-4 text-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 