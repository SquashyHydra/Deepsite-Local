import {
  ChartSpline,
  CirclePlus,
  FolderCode,
  Import,
  LogOut,
} from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export const UserMenu = ({ className }: { className?: string }) => {
  const user = process.env.displayname || "MEEP";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${className}`}>
          <Avatar className="size-8 mr-1">
            <AvatarFallback className="text-sm">
              {user.charAt(0).toUpperCase() ?? "E"}
            </AvatarFallback>
          </Avatar>
          <span className="max-lg:hidden">{user}</span>
          <span className="lg:hidden">
            {user.slice(0, 10)}
            {(user.length ?? 0) > 10 ? "..." : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuGroup>
          <Link href="/projects/new">
            <DropdownMenuItem>
              <CirclePlus className="size-4 text-neutral-100" />
              New Project
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <Import className="size-4 text-neutral-100" />
              Import Project
            </DropdownMenuItem>
          </Link>
          <Link href="/projects">
            <DropdownMenuItem>
              <FolderCode className="size-4 text-neutral-100" />
              View Projects
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
