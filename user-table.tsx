import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";

export function UserTable() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent User Registrations</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent User Registrations</h3>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" data-testid="button-export-users">
              Export
            </Button>
            <Button variant="default" size="sm" data-testid="button-add-user">
              Add User
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Registration Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  <i className="fas fa-users text-2xl mb-2 block"></i>
                  No users registered yet
                </td>
              </tr>
            ) : (
              users.map((user: User) => (
                <tr key={user.id} className="hover:bg-muted/50" data-testid={`user-row-${user.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(user.telegramName || user.telegramUsername || 'U')}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-foreground">
                          {user.telegramUsername ? `@${user.telegramUsername}` : user.telegramName || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">ID: {user.telegramId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {user.phoneNumber || 'Not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      user.isActive 
                        ? "bg-chart-2/10 text-chart-2"
                        : "bg-chart-4/10 text-chart-4"
                    )}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:text-primary/80 mr-3" data-testid={`button-view-${user.id}`}>
                      View
                    </button>
                    <button className="text-muted-foreground hover:text-foreground mr-3" data-testid={`button-edit-${user.id}`}>
                      Edit
                    </button>
                    <button 
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      disabled={deleteUserMutation.isPending}
                      data-testid={`button-delete-${user.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {users && users.length > 0 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, users.length)}</span> of <span className="font-medium">{users.length}</span> users
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="sm" disabled data-testid="button-previous">
                Previous
              </Button>
              <Button variant="default" size="sm" data-testid="button-next">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
