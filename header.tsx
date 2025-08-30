import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle: string;
  botOnline?: boolean;
}

export function Header({ title, subtitle, botOnline = true }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="page-subtitle">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Bot Status */}
          <div className="flex items-center space-x-2" data-testid="bot-status">
            <div className={cn(
              "w-2 h-2 rounded-full",
              botOnline ? "bg-chart-2 animate-pulse" : "bg-chart-4"
            )}></div>
            <span className="text-sm text-foreground font-medium">
              Bot {botOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" data-testid="button-notifications">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-destructive-foreground">
              3
            </span>
          </button>
          
          {/* Settings */}
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" data-testid="button-settings">
            <i className="fas fa-cog text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
