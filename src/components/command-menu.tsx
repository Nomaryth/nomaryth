
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import {
  File,
  Book,
  Home,
  Map,
  Swords,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface Doc {
  slug: string;
  title: string;
}

interface Category {
  categorySlug: string;
  categoryTitle: string;
  documents: Doc[];
}

interface CommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data: Category[]) => {
        if (Array.isArray(data)) {
            const flattenedDocs = data.flatMap((category) =>
            category.documents.map((doc) => ({
                ...doc,
                slug: `${category.categorySlug}/${doc.slug}`,
            }))
            );
            setDocs(flattenedDocs);
        } else {
            setDocs([]);
        }
      });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA';

      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      } else if (e.key.toLowerCase() === 'k' && !isInputFocused) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  const mainNavItems = [
    { name: 'Home', href: '/', icon: <Home className="mr-2 h-4 w-4" /> },
    {
      name: 'Projects',
      href: '/projects',
      icon: <Swords className="mr-2 h-4 w-4" />,
    },
    { name: 'Map', href: '/map', icon: <Map className="mr-2 h-4 w-4" /> },
  ];

  if (user) {
    mainNavItems.push({
      name: 'Profile',
      href: '/profile',
      icon: <User className="mr-2 h-4 w-4" />,
    });
  }
  
  if (isAdmin) {
    mainNavItems.push({
      name: 'Admin Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Menu</DialogTitle>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {mainNavItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.name}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              {item.icon}
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Documentation">
          {docs.map((doc) => (
            <CommandItem
              key={doc.slug}
              value={doc.title}
              onSelect={() => runCommand(() => router.push(`/docs/${doc.slug}`))}
            >
              <Book className="mr-2 h-4 w-4" />
              <span>{doc.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
