import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, signIn, signUp, updatePassword } = useOfflineAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const type = searchParams.get('type');
  const mode = searchParams.get('mode') || 'signin';
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
    
    // In offline mode, password reset is not available
    toast({
      title: "Offline Mode",
      description: "Password reset is not available in offline mode. Please contact support if you need help.",
      variant: "destructive",
    });
  };

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
              <span className="text-gray-200">Reset Password</span>
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
                className="p-0 text-gray-300 hover:text-gray-100"
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
              <span className="text-gray-200">Create Account</span>
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
                className="p-0 text-gray-300 hover:text-gray-100"
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
            <span className="text-gray-200">Welcome Back</span>
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
                className="p-0 text-gray-300 hover:text-gray-100 font-medium"
                onClick={() => navigate('/auth?mode=reset')}
              >
                Forgot your password?
              </Button>
            </div>
            
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 text-gray-300 hover:text-gray-100"
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