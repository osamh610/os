import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Message } from "@shared/schema";

export function RecentMessages() {
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    select: (data: Message[]) => data.slice(0, 5)
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Messages</h3>
        </div>
        <div className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-border animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'chart-2';
      case 'pending': return 'chart-3';
      case 'failed': return 'chart-4';
      default: return 'muted';
    }
  };

  const getTimeAgo = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Messages</h3>
          <button className="text-sm text-primary hover:text-primary/80 font-medium" data-testid="button-view-all">
            View All
          </button>
        </div>
      </div>
      <div className="p-0">
        {!messages || messages.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <i className="fas fa-comment-slash text-2xl mb-2"></i>
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50" data-testid={`message-${message.id}`}>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-mobile text-primary text-sm"></i>
                </div>
                <div>
                  <p className="font-medium text-foreground">{message.fromPhoneNumber}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {message.content.length > 50 ? `${message.content.slice(0, 50)}...` : message.content}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {getTimeAgo(message.timestamp || new Date())}
                </p>
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  `bg-${getStatusColor(message.status)}/10 text-${getStatusColor(message.status)}`
                )}>
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
