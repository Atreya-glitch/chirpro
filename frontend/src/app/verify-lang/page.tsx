
"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getStore, updateStore } from "@/lib/store";
import { Globe, Lock, ShieldCheck, Mail, Smartphone } from "lucide-react";
import Link from "next/link";

function VerifyLangContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'English';
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const store = getStore();

  const isFrench = lang === 'French';
  const methodLabel = isFrench ? 'Registered Email' : 'Mobile Number';
  const MethodIcon = isFrench ? Mail : Smartphone;

  const handleVerify = () => {
    
    if (otp === "123456") {
      updateStore({ language: lang });
      toast({ 
        title: "Language Switched", 
        description: `Language successfully changed to ${lang}. Your preferences have been updated.`,
      });
      router.push('/profile');
    } else {
      toast({ 
        title: "Invalid Code", 
        description: "The verification code is incorrect. Please use 123456 for this demo.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <Card className="w-full max-w-md border-none shadow-2xl ring-1 ring-border overflow-hidden">
        <div className="h-2 bg-accent w-full" />
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Language Change</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Switching to <strong>{lang}</strong> requires verification. 
            An OTP has been sent to your <strong>{methodLabel}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/50">
            <MethodIcon className="w-5 h-5 text-accent" />
            <div className="text-sm">
              <p className="font-semibold">{isFrench ? store.email : store.phone}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Verification Target</p>
            </div>
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Enter 6-digit OTP" 
              className="pl-10 text-center tracking-[0.5em] text-xl font-bold h-12 rounded-xl" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
            Demo Code: 123456
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full rounded-full bg-accent hover:bg-accent/90 h-12 font-bold text-white shadow-lg shadow-accent/20" 
            onClick={handleVerify}
            disabled={otp.length !== 6}
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Confirm Language Switch
          </Button>
          <Button variant="ghost" className="text-xs text-muted-foreground" asChild>
            <Link href="/profile">Cancel and Go Back</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyLangPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Security Interface...</div>}>
      <VerifyLangContent />
    </Suspense>
  );
}
