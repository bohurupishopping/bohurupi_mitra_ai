import { Button } from "@/components/ui/button";
import { Code, BookOpen, MessageSquare, Image } from 'lucide-react';

const ContentTypeSelector = () => {
  const contentTypes = [
    { icon: Code, label: 'Code', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
    { icon: BookOpen, label: 'Story', color: 'bg-green-100 hover:bg-green-200 text-green-700' },
    { icon: MessageSquare, label: 'Social', color: 'bg-purple-100 hover:bg-purple-200 text-purple-700' },
    { icon: Image, label: 'Image', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700' },
  ];

  return (
    <div className="flex space-x-2">
      {contentTypes.map((type) => (
        <Button
          key={type.label}
          variant="ghost"
          className={`flex items-center space-x-2 ${type.color} border-none transition-all duration-200 hover:scale-105`}
        >
          <type.icon className="h-4 w-4" />
          <span>{type.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default ContentTypeSelector;