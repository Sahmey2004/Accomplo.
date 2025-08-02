import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signIn, signUp, resetPassword, updatePassword } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const type = searchParams.get('type');
  const mode = searchParams.get('mode') || 'signin';
  const isRecovery = type === 'recovery';

  // Handle recovery token from URL hash
  useEffect(() => {
    if (isRecovery) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session with the recovery tokens
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (error) {
            console.error('Error setting recovery session:', error);
            toast({
              title: "Recovery link invalid",
              description: "This recovery link is invalid or has expired. Please request a new one.",
              variant: "destructive",
            });
            navigate('/auth?mode=reset');
          } else {
            setIsRecoveryReady(true);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        });
      } else {
        toast({
          title: "Invalid recovery link",
          description: "This recovery link is missing required information. Please request a new one.",
          variant: "destructive",
        });
        navigate('/auth?mode=reset');
      }
    }
  }, [isRecovery, navigate, toast]);
  useEffect(() => {
    if (user && !isRecovery) {
      navigate('/');
    }
  }, [user, navigate, isRecovery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(formData.email, formData.password, {
      display_name: formData.displayName,
    });
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to complete your registration.",
      });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(formData.email);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a password reset link. Please check your inbox and spam folder.",
      });
      setFormData(prev => ({ ...prev, email: '' }));
    }
    setIsLoading(false);
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await updatePassword(formData.password);

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      setFormData({ email: '', password: '', displayName: '' });
      navigate('/auth');
    }
    setIsLoading(false);
  };

  // Password Recovery Form
  if (isRecovery) {
    if (!isRecoveryReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
          <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying recovery link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://ik.imagekit.io/1de4hfu56k/logo.png?updatedAt=1754163451179" 
                alt="Accomplo Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Set New Password
            </CardTitle>
            <CardDescription>
              Your recovery link is valid. Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your new password (min 6 characters)"
                    required
                    className="bg-muted/50 border-muted pr-10"
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gray-600 hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset Password Form
  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://ik.imagekit.io/1de4hfu56k/logo.png?updatedAt=1754163451179" 
                alt="Accomplo Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                  className="bg-muted/50 border-muted"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gray-600 hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="link" 
                className="p-0 text-primary"
                onClick={() => navigate('/auth')}
              >
                ← Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sign Up Form
  if (mode === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://ik.imagekit.io/1de4hfu56k/logo.png?updatedAt=1754163451179" 
                alt="Accomplo Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription>
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                  className="bg-muted/50 border-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  className="bg-muted/50 border-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password (min 6 characters)"
                    required
                    className="bg-muted/50 border-muted pr-10"
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gray-600 hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 text-primary"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Sign In Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://ik.imagekit.io/1de4hfu56k/logo.png?updatedAt=1754163451179" 
              alt="Accomplo Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                console.error('Logo failed to load:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to your Accomplo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="bg-muted/50 border-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="bg-muted/50 border-muted pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gray-600 hover:bg-gray-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Button 
                variant="link" 
                className="p-0 text-primary font-medium"
                onClick={() => navigate('/auth?mode=reset')}
              >
                Forgot your password?
              </Button>
            </div>
            
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 text-primary"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}