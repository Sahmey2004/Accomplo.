import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Settings, User, Lock, Plus, Trophy, Star, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

interface Accomplishment {
  id: string;
  content: string;
  type: 'big' | 'small';
  category: string;
  month_year: string;
  created_at: string;
  profile_id: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  accomplishments: Accomplishment[];
  isCurrentWeek: boolean;
  isRevealed: boolean;
}

const Index = () => {
  const { user, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Settings state
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

  // Accomplishment state
  const [isAccomplishmentDialogOpen, setIsAccomplishmentDialogOpen] = useState(false);
  const [accomplishmentForm, setAccomplishmentForm] = useState({
    content: '',
    type: '' as 'big' | 'small' | '',
    category: ''
  });

  // Expanded weeks state
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Get week info for any date
  const getWeekInfo = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Check if it's Sunday after 6 PM (week end reveal time)
    const now = new Date();
    const isWeekEnd = now.getDay() === 0 && now.getHours() >= 18;
    
    return {
      startOfWeek,
      endOfWeek,
      isWeekEnd,
      weekLabel: `Week of ${startOfWeek.toLocaleDateString()}`
    };
  };

  // Get current week info
  const getCurrentWeekInfo = () => {
    const now = new Date();
    return getWeekInfo(now);
  };

  const { startOfWeek, endOfWeek, isWeekEnd, weekLabel } = getCurrentWeekInfo();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Create profile if it doesn't exist
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.display_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newProfile;
      }
      
      return data;
    },
    enabled: !!user
  });

  // Fetch all accomplishments for the user
  const { data: allAccomplishments = [], isLoading: isLoadingAccomplishments } = useQuery({
    queryKey: ['accomplishments', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Accomplishment[];
    },
    enabled: !!profile
  });

  // Process accomplishments into weeks
  const weeklyData: WeekData[] = React.useMemo(() => {
    // Use only real accomplishments from the database
    const accomplishmentsToProcess = allAccomplishments;

    // Group accomplishments by week
    const weekMap = new Map<string, Accomplishment[]>();
    
    accomplishmentsToProcess.forEach(accomplishment => {
      const accomplishmentDate = new Date(accomplishment.created_at);
      const weekInfo = getWeekInfo(accomplishmentDate);
      const weekKey = weekInfo.startOfWeek.toISOString();
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(accomplishment);
    });

    // Convert to WeekData array and sort by most recent first
    const weeks: WeekData[] = Array.from(weekMap.entries()).map(([weekKey, accomplishments]) => {
      const weekStart = new Date(weekKey);
      const weekInfo = getWeekInfo(weekStart);
      const now = new Date();
      const isCurrentWeek = now >= weekInfo.startOfWeek && now <= weekInfo.endOfWeek;
      
      // Reveal logic: 
      // - Past weeks are always revealed
      // - Current week is revealed only on Sunday after 6 PM
      const isRevealed = !isCurrentWeek || (isCurrentWeek && now.getDay() === 0 && now.getHours() >= 18);
      
      return {
        weekStart: weekInfo.startOfWeek,
        weekEnd: weekInfo.endOfWeek,
        weekLabel: weekInfo.weekLabel,
        accomplishments,
        isCurrentWeek,
        isRevealed
      };
    }).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

    return weeks;
  }, [allAccomplishments]);

  // Get current week's accomplishments
  const currentWeekAccomplishments = weeklyData.find(week => week.isCurrentWeek)?.accomplishments || [];

  const toggleWeekExpansion = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  // Add accomplishment mutation
  const addAccomplishmentMutation = useMutation({
    mutationFn: async (accomplishment: { content: string; type: 'big' | 'small'; category: string }) => {
      if (!profile) throw new Error('Profile not found');
      
      const { data, error } = await supabase
        .from('accomplishments')
        .insert({
          content: accomplishment.content,
          type: accomplishment.type,
          category: accomplishment.category,
          profile_id: profile.id,
          month_year: new Date().toISOString().slice(0, 7) // YYYY-MM format
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments'] });
      toast({
        title: "Success!",
        description: "Your accomplishment has been recorded.",
      });
      setAccomplishmentForm({ content: '', type: '', category: '' });
      setIsAccomplishmentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record accomplishment. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding accomplishment:', error);
    }
  });

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Use React Router navigation
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
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

  const handleAccomplishmentInputChange = (field: string, value: string) => {
    setAccomplishmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccomplishmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accomplishmentForm.content.trim()) {
      toast({
        title: "Content required",
        description: "Please describe your accomplishment",
        variant: "destructive",
      });
      return;
    }

    if (!accomplishmentForm.type) {
      toast({
        title: "Type required",
        description: "Please select accomplishment type",
        variant: "destructive",
      });
      return;
    }

    if (!accomplishmentForm.category.trim()) {
      toast({
        title: "Side note required",
        description: "Please add what this achievement is about",
        variant: "destructive",
      });
      return;
    }

    addAccomplishmentMutation.mutate({
      content: accomplishmentForm.content.trim(),
      type: accomplishmentForm.type as 'big' | 'small',
      category: accomplishmentForm.category.trim()
    });
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
                    className="bg-gray-600 hover:bg-gray-700"
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
                    className="bg-gray-600 hover:bg-gray-700"
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
          <div className="flex items-center">
            <div className="flex items-center">
              <img 
                src="https://ik.imagekit.io/1de4hfu56k/logo.png?updatedAt=1754163451179" 
                alt="Accomplo Logo" 
                className="h-12 w-auto"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
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
          {/* Week Summary Card */}
          <Card className="bg-glass-bg border-glass-border backdrop-blur-glass mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    {weekLabel}
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-300">
                    {isWeekEnd 
                      ? "🎉 Week complete! Your accomplishments are now revealed below."
                      : "Keep going! Your accomplishments will be revealed at the end of the week."
                    }
                  </CardDescription>
                </div>
                <Dialog open={isAccomplishmentDialogOpen} onOpenChange={setIsAccomplishmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gray-600 hover:bg-gray-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Accomplishment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Your Accomplishment</DialogTitle>
                      <DialogDescription>
                        Add a new achievement to your weekly collection. It will be revealed at the end of the week!
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAccomplishmentSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="accomplishment-type">Type</Label>
                        <Select 
                          value={accomplishmentForm.type} 
                          onValueChange={(value) => handleAccomplishmentInputChange('type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose accomplishment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-blue-500" />
                                Small Win
                              </div>
                            </SelectItem>
                            <SelectItem value="big">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Big Achievement
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accomplishment-content">Accomplishment</Label>
                        <Textarea
                          id="accomplishment-content"
                          value={accomplishmentForm.content}
                          onChange={(e) => handleAccomplishmentInputChange('content', e.target.value)}
                          placeholder="Describe your accomplishment..."
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accomplishment-category">Side Note</Label>
                        <Input
                          id="accomplishment-category"
                          value={accomplishmentForm.category}
                          onChange={(e) => handleAccomplishmentInputChange('category', e.target.value)}
                          placeholder="What is this achievement about?"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAccomplishmentDialogOpen(false);
                            setAccomplishmentForm({ content: '', type: '', category: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={addAccomplishmentMutation.isPending}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          {addAccomplishmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Record Achievement
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Week Stats */}
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-2">
                    {isLoadingAccomplishments ? '...' : currentWeekAccomplishments?.length || 0}
                  </div>
                  <div className="text-sm text-gray-300">
                    Total This Week
                  </div>
                </div>
                
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold text-gray-200 mb-2">
                    {isLoadingAccomplishments ? '...' : currentWeekAccomplishments?.filter(a => a.type === 'big').length || 0}
                  </div>
                  <div className="text-sm text-gray-300 flex items-center justify-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Big Achievements
                  </div>
                </div>
                
                <div className="text-center p-6 bg-muted/20 rounded-lg">
                  <div className="text-3xl font-bold text-gray-200 mb-2">
                    {isLoadingAccomplishments ? '...' : currentWeekAccomplishments?.filter(a => a.type === 'small').length || 0}
                  </div>
                  <div className="text-sm text-gray-300 flex items-center justify-center gap-1">
                    <Star className="h-4 w-4" />
                    Small Wins
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Accomplishments Sections */}
          <div className="space-y-6">
            {isLoadingAccomplishments ? (
              <Card className="bg-glass-bg border-glass-border backdrop-blur-glass">
                <CardContent className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-gray-300">Loading your accomplishments...</p>
                </CardContent>
              </Card>
            ) : weeklyData.length === 0 ? (
              <Card className="bg-glass-bg border-glass-border backdrop-blur-glass mb-8">
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">Ready to Start Tracking?</h3>
                  <p className="text-gray-300 mb-6">
                    Record your first accomplishment! Your achievements will be revealed at the end of each week.
                  </p>
                </CardContent>
              </Card>
            ) : (
              weeklyData.map((week) => {
                const weekKey = week.weekStart.toISOString();
                const isExpanded = expandedWeeks.has(weekKey);
                
                return (
                  <Card key={weekKey} className="bg-glass-bg border-glass-border backdrop-blur-glass">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-lg">
                              {week.weekLabel}
                              {week.isCurrentWeek && (
                                <Badge variant="secondary" className="ml-2">Current Week</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                              {week.accomplishments.length} accomplishment{week.accomplishments.length !== 1 ? 's' : ''} recorded
                              {week.isCurrentWeek && !week.isRevealed && (
                                <span className="ml-2">• Reveals Sunday evening</span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Week stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-400 mr-4">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span>{week.accomplishments.filter(a => a.type === 'big').length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span>{week.accomplishments.filter(a => a.type === 'small').length}</span>
                            </div>
                          </div>
                          
                          {week.isRevealed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWeekExpansion(weekKey)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {!week.isRevealed ? (
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <Lock className="h-12 w-12 mx-auto text-white" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-300 font-medium">
                              {week.accomplishments.length} accomplishment{week.accomplishments.length !== 1 ? 's' : ''} recorded this week
                            </p>
                            <p className="text-sm text-gray-400">
                            {week.isCurrentWeek 
                              ? "Your accomplishments will be revealed on Sunday after 6 PM!"
                              : "Accomplishments were locked until week end"
                            }
                            </p>
                          </div>
                        </div>
                      ) : isExpanded ? (
                        <div className="space-y-4">
                          {week.accomplishments.map((accomplishment) => (
                            <div
                              key={accomplishment.id}
                              className="p-4 bg-muted/10 rounded-lg border border-muted/20"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {accomplishment.type === 'big' ? (
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                  ) : (
                                    <Star className="h-5 w-5 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={accomplishment.type === 'big' ? 'default' : 'secondary'}>
                                      {accomplishment.type === 'big' ? 'Big Achievement' : 'Small Win'}
                                    </Badge>
                                    <span className="text-sm text-gray-400">
                                      {new Date(accomplishment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-white mb-2">{accomplishment.content}</p>
                                  <p className="text-sm text-gray-400 italic">
                                    About: {accomplishment.category}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-300">
                            Click to expand and view {week.accomplishments.length} accomplishment{week.accomplishments.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;