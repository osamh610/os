import { useQuery } from "@tanstack/react-query";
import type { BotStats } from "@shared/schema";

interface StatsGridProps {}

export function StatsGrid({}: StatsGridProps) {
  const { data: stats, isLoading } = useQuery<BotStats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card p-6 rounded-lg border border-border animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: "fas fa-users",
      color: "chart-1",
      change: "+12%",
      changeLabel: "from last month"
    },
    {
      title: "Messages Today",
      value: stats?.messagesToday || 0,
      icon: "fas fa-comment-dots",
      color: "chart-2",
      change: "+8%",
      changeLabel: "from yesterday"
    },
    {
      title: "Success Rate",
      value: stats?.successRate || "0%",
      icon: "fas fa-check-circle",
      color: "chart-2",
      change: "+0.3%",
      changeLabel: "improvement"
    },
    {
      title: "Active Sessions",
      value: stats?.activeSessions || 0,
      icon: "fas fa-bolt",
      color: "chart-3",
      change: "Live",
      changeLabel: "right now"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-card p-6 rounded-lg border border-border" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
              <i className={`${stat.icon} text-${stat.color} text-xl`}></i>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`text-${stat.change.startsWith('+') ? 'chart-2' : 'chart-3'} font-medium`}>
              {stat.change}
            </span>
            <span className="text-muted-foreground ml-1">{stat.changeLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
