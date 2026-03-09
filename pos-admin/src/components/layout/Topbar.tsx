import { Menu, Sun, Moon, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";

interface TopbarProps {
    onMobileMenuOpen: () => void;
    pageTitle: string;
}

export function Topbar({ onMobileMenuOpen, pageTitle }: TopbarProps) {
    const { theme, setTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem("pos_user") || '{"name": "Admin"}');

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onMobileMenuOpen}
                id="mobile-menu-button"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
            </Button>

            {/* Page title */}
            <div className="flex-1">
                <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-4 font-mono text-xs bg-background/80 border rounded px-1.5 py-0.5">⌘K</kbd>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    id="theme-toggle"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="relative"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" id="notifications-button">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                    <span className="sr-only">Notifications</span>
                </Button>

                {/* User Info & Logout */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-xs font-medium">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {user.roles?.[0]?.name || "Staff"}
                        </p>
                    </div>

                    <Avatar
                        className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to log out?")) {
                                localStorage.removeItem("pos_access_token");
                                localStorage.removeItem("pos_user");
                                window.location.href = "/login";
                            }
                        }}
                    >
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
