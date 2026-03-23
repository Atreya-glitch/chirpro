"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addLoginHistory } from "@/lib/store";
import { Mail, Lock, ShieldCheck } from "lucide-react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'user@example.com';
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleVerify = () => {
    // Simulated OTP verification
    if (otp === "123456") {
      addLoginHistory();
      toast({ title: "Verified!", description: "Welcome to ChirpPro." });
      router.push('/');
    } else {
      toast({ title: "Invalid Code", description: "Please enter 123456 for this demo.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md border-none shadow-2xl ring-1 ring-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            We've sent a code to <strong>{email}</strong>. This is required for Google Chrome users.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Enter 6-digit OTP" 
              className="pl-10 text-center tracking-[0.5em] text-xl font-bold h-12" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Tip: For this prototype, use <strong>123456</strong>
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full rounded-full bg-primary h-12 font-bold" 
            onClick={handleVerify}
            disabled={otp.length !== 6}
          >
            Verify & Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
