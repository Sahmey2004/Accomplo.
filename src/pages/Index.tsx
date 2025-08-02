import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Settings, User, Lock } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, signOut, updatePassword } = useAuth();
  const { toast } = useToast();
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'password' | 'username'>('main');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [usernameForm, setUsernameForm] = useState({
    displayName: ''
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(passwordForm.newPassword);
    
    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setSettingsView('main');
    }
    setIsUpdatingPassword(false);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameForm.displayName.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingUsername(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: usernameForm.displayName.trim() }
    });
    
    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your display name has been updated successfully",
      });
      setUsernameForm({
        displayName: ''
      });
      setSettingsView('main');
    }
    setIsUpdatingUsername(false);
  };

  const resetForms = () => {
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setUsernameForm({
      displayName: ''
    });
    setSettingsView('main');
  };

  const renderSettingsContent = () => {
    switch (settingsView) {
      case 'password':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your new password. Make sure to use a strong password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsView('main')}
                >
                  ← Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSettingsDialogOpen(false);
                      resetForms();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          </>
        );

      case 'username':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Change Display Name</DialogTitle>
              <DialogDescription>
                Update your display name. This is how others will see you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  name="displayName"
                  type="text"
                  value={usernameForm.displayName}
                  onChange={handleUsernameChange}
                  placeholder={`Current: ${user?.user_metadata?.display_name || user?.email || 'Not set'}`}
                  required
                />
              </div>
              <div className="flex justify-between gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsView('main')}
                >
                  ← Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSettingsDialogOpen(false);
                      resetForms();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingUsername}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isUpdatingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Name
                  </Button>
                </div>
              </div>
            </form>
          </>
        );

      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Manage your account settings and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => setSettingsView('password')}
              >
                <Lock className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Change Password</div>
                  <div className="text-sm text-muted-foreground">Update your account password</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => setSettingsView('username')}
              >
                <User className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Change Display Name</div>
                  <div className="text-sm text-muted-foreground">Update how others see your name</div>
                </div>
              </Button>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsSettingsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </>
        );
    }
  };
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Accomplishment Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.display_name || user?.email}
            </span>
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {renderSettingsContent()}
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-glass-bg border-glass-border backdrop-blur-glass">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Track Your Accomplishments
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Keep track of your achievements and celebrate your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Your accomplishment tracking system is ready! 
                  The database has been set up with user profiles and proper security.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Next steps: Build your accomplishment tracking interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;