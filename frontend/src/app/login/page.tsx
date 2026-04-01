"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getBrowserInfo, isTimeInRange } from "@/lib/ist-utils";
import { addLoginHistory, updateStore } from "@/lib/store";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { browser, isMobile } = getBrowserInfo();

    if (isMobile && !isTimeInRange(10, 13)) {
      toast({
        title: "Access Restricted",
        description: "Mobile logins are only allowed between 10:00 AM and 1:00 PM IST.",
        variant: "destructive",
      });
      return;
    }

    if (browser === 'Google Chrome') {
      toast({ 
        title: "Identity Verification", 
        description: "Chrome users must verify via email OTP sent to " + email
      });
      router.push(`/verify-otp?type=email&email=${email}`);
      return;
    }

    if (browser === 'Microsoft Edge') {
      addLoginHistory(); 
      toast({ title: "Welcome Back!", description: "Edge browser recognized. Logged in successfully." });
      router.push('/');
      return;
    }

    addLoginHistory();
    toast({ title: "Welcome!", description: "You have been logged in." });
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md border-none shadow-2xl ring-1 ring-border p-4">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Sign In</CardTitle>
          <p className="text-muted-foreground">Access your premium social experience</p>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Email Address" 
                  className="pl-10 h-11 rounded-xl"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="Password" className="pl-10 h-11 rounded-xl" required />
              </div>
            </div>
            <div className="text-right">
              <Button variant="link" size="sm" type="button" onClick={() => router.push('/forgot-password')}>
                Forgot password?
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-11 rounded-full bg-primary text-lg font-semibold btn-hover" type="submit">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}