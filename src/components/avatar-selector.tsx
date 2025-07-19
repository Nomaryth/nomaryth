
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/context/i18n-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AVATARS = [
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar1.png?raw=true',
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar2.png?raw=true',
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar3.png?raw=true',
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar4.png?raw=true',
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar5.png?raw=true',
    'https://github.com/Nomaryth/nomaryth/blob/main/assets/avatars/avatar6.png?raw=true',
];


interface AvatarSelectorProps {
  children: React.ReactNode;
  onAvatarSelect: (url: string) => void;
}

export function AvatarSelector({ children, onAvatarSelect }: AvatarSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleSelect = (url: string) => {
    setSelectedAvatar(url);
  };
  
  const handleConfirm = () => {
    if (selectedAvatar) {
        onAvatarSelect(selectedAvatar);
        setIsOpen(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('profile.avatar_selector.title')}</DialogTitle>
          <DialogDescription>{t('profile.avatar_selector.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
            {AVATARS.map((url) => (
                <button 
                    key={url} 
                    onClick={() => handleSelect(url)}
                    className={cn(
                        "rounded-full ring-2 ring-transparent hover:ring-accent focus:outline-none focus:ring-accent transition-all",
                        selectedAvatar === url && "ring-accent ring-offset-2 ring-offset-background"
                    )}
                >
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={url} alt="Avatar option" />
                    </Avatar>
                </button>
            ))}
        </div>
        <Button onClick={handleConfirm} disabled={!selectedAvatar}>
            {t('profile.avatar_selector.confirm_button')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
