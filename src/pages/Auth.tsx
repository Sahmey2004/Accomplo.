import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  // Form states
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });
  
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  const [resetForm, setResetForm] = useState({
    email: ''
  });

  // Check for recovery type on mount
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setActiveTab('reset');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInForm.email, signInForm.password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (signUpForm.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(
      signUpForm.email, 
      signUpForm.password,
      { display_name: signUpForm.displayName }
    );
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      setActiveTab('signin');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(resetForm.email);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      });
    }
    setIsLoading(false);
  };

  const handleSignInInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignInForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md bg-glass-bg border-glass-border backdrop-blur-glass">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
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
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-200">
                  Welcome Back
                </CardTitle>
                <CardDescription className="mt-2 text-gray-300">
                  Sign in to your account to continue
                </CardDescription>
              </div>
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    value={signInForm.email}
                    onChange={handleSignInInputChange}
                    required
                    placeholder="Enter your email"
                    className="bg-muted/50 border-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={signInForm.password}
                      onChange={handleSignInInputChange}
                      required
                      placeholder="Enter your password"
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
              
              <div className="text-center space-y-2">
                <Button
                  variant="link"
                  onClick={() => setActiveTab('reset')}
                  className="text-gray-300 hover:text-gray-100"
                >
                  Forgot your password?
                </Button>
                <div className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Button
                    variant="link"
                    onClick={() => setActiveTab('signup')}
                    className="text-gray-300 hover:text-gray-100 p-0"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-200">
                  Create Account
                </CardTitle>
                <CardDescription className="mt-2 text-gray-300">
                  Join us to start tracking your accomplishments
                </CardDescription>
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    name="displayName"
                    type="text"
                    value={signUpForm.displayName}
                    onChange={handleSignUpInputChange}
                    placeholder="Enter your display name"
                    className="bg-muted/50 border-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={signUpForm.email}
                    onChange={handleSignUpInputChange}
                    required
                    placeholder="Enter your email"
                    className="bg-muted/50 border-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={signUpForm.password}
                      onChange={handleSignUpInputChange}
                      required
                      placeholder="Create a password (min 6 characters)"
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
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpForm.confirmPassword}
                      onChange={handleSignUpInputChange}
                      required
                      placeholder="Confirm your password"
                      className="bg-muted/50 border-muted pr-10"
                      minLength={6}
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
                <Button
                  type="submit"
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
              
              <div className="text-center">
                <div className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    onClick={() => setActiveTab('signin')}
                    className="text-gray-300 hover:text-gray-100 p-0"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reset" className="space-y-4">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-200">
                  Reset Password
                </CardTitle>
                <CardDescription className="mt-2 text-gray-300">
                  Enter your email to receive a password reset link
                </CardDescription>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    value={resetForm.email}
                    onChange={handleResetInputChange}
                    required
                    placeholder="Enter your email"
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
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setActiveTab('signin')}
                  className="text-gray-300 hover:text-gray-100"
                >
                  ← Back to Sign In
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}