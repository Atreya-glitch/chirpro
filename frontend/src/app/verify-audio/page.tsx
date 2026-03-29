
"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getStore, updateStore } from "@/lib/store";
import { Mic, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

function VerifyAudioContent() {
  const searchParams = useSearchParams();
  const text = searchParams.get('text') || '';
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleVerify = () => {
    if (otp === "123456") {
      const store = getStore();
      const tweets = JSON.parse(localStorage.getItem('chirppro_tweets') || '[]');
      
      const newTweet = {
        id: Date.now(),
        author: store.email,
        content: text || "Voice Chirp",
        timestamp: new Date().toISOString(),
        type: 'audio'
      };

      localStorage.setItem('chirppro_tweets', JSON.stringify([newTweet, ...tweets]));
      updateStore({ tweetCount: store.tweetCount + 1 });

      toast({ title: "Verified & Posted!", description: "Your audio chirp is now live." });
      router.push('/');
    } else {
      toast({ title: "Invalid Code", description: "Please enter 123456 to verify your identity.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <Card className="w-full max-w-md border-none shadow-2xl ring-1 ring-border overflow-hidden">
        <div className="h-2 bg-accent w-full" />
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 w-fit">
            <ArrowLeft className="w-3 h-3" /> Cancel
          </Link>
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">Audio Verification</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Identity verification is required for all audio uploads. We've sent an OTP to your email.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-secondary/30 rounded-xl border border-border/50 italic text-sm text-muted-foreground">
            "{text || 'Voice message only'}"
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
            Verify & Post Audio
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Audio uploads are monitored and restricted to 2:00 PM - 7:00 PM IST.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyAudioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Verifying...</div>}>
      <VerifyAudioContent />
    </Suspense>
  );
}
