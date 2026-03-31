
"use client"

import { useState } from "react";
import { Mic, Send, Volume2, X, Music, Lock, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getStore, updateStore } from "@/lib/store";
import { getSubscriptionLimits, isTimeInRange } from "@/lib/ist-utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function TweetComposer({ onTweetCreated }: { onTweetCreated: () => void }) {
  const [content, setContent] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { checkTweetForNotification } = useNotifications();

  const handlePost = async () => {
    const store = getStore();
    const limit = getSubscriptionLimits(store.subscription);

    if (store.tweetCount >= limit) {
      toast({
        title: "Limit Reached",
        description: `Your ${store.subscription} plan allows only ${limit} tweets. Upgrade for more.`,
        variant: "destructive",
      });
      return;
    }

    if (audioFile) {
      // Audio Tweeting Window: 2:00 PM - 7:00 PM IST
      if (!isTimeInRange(14, 19)) {
        toast({
          title: "Audio Posting Restricted",
          description: "Voice chirps can only be posted between 2:00 PM and 7:00 PM IST.",
          variant: "destructive",
        });
        return;
      }
      
      // Open OTP Dialog before final post
      setShowOTP(true);
      return;
    }

    // Regular Text Tweet
    performFinalPost('text');
  };

  const performFinalPost = (type: 'text' | 'audio') => {
    const store = getStore();
   checkTweetForNotification({ id: Date.now(), content });
    const tweets = JSON.parse(localStorage.getItem('chirppro_tweets') || '[]');
    const newTweet = {
      id: Date.now(),
      author: store.email,
      content,
      timestamp: new Date().toISOString(),
      type: type
    };
    localStorage.setItem('chirppro_tweets', JSON.stringify([newTweet, ...tweets]));
    updateStore({ tweetCount: store.tweetCount + 1 });
    
    setContent("");
    setAudioFile(null);
    onTweetCreated();
    toast({ title: "Success", description: `Your ${type} chirp was posted!` });
  };

  const handleVerifyOTP = () => {
    if (otp === "123456") {
      setIsVerifying(true);
      // Simulate verification processing
      setTimeout(() => {
        performFinalPost('audio');
        setShowOTP(false);
        setOtp("");
        setIsVerifying(false);
      }, 1000);
    } else {
      toast({ 
        title: "Invalid Code", 
        description: "Please enter 123456 for this demo.", 
        variant: "destructive" 
      });
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 100MB Limit
      if (file.size > 100 * 1024 * 1024) {
        toast({ 
          title: "File Too Large", 
          description: "Audio files must be under 100 MB.", 
          variant: "destructive" 
        });
        return;
      }
      
      // Check time window early for UX
      if (!isTimeInRange(14, 19)) {
        toast({
          title: "Outside Posting Window",
          description: "Audio uploads are only active between 2:00 PM and 7:00 PM IST.",
          variant: "destructive",
        });
        return;
      }

      setAudioFile(file);
      toast({ title: "Audio Selected", description: `${file.name} is ready. Verification required on post.` });
    }
  };

  return (
    <>
      <Card className="mb-6 overflow-hidden border-none shadow-sm ring-1 ring-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <Textarea 
            placeholder="What's happening? Add a caption to your audio chirp..." 
            className="resize-none border-none focus-visible:ring-0 text-lg bg-transparent min-h-[100px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {audioFile && (
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-2xl border border-accent/20 animate-in zoom-in-95 duration-300">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Volume2 className="text-white w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{audioFile.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Voice Chirp Attached</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/20" onClick={() => setAudioFile(null)}>
                <X className="w-4 h-4 text-accent" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer group">
                <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                <div className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-accent/10 transition-colors text-accent">
                  <Mic className="w-5 h-5" />
                  <span className="text-xs font-semibold hidden sm:inline">Add Voice</span>
                </div>
              </label>
              {!audioFile && (
                <div className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                  <Music className="w-3 h-3" /> 2PM-7PM IST
                </div>
              )}
            </div>
            <Button 
              className="rounded-full px-8 bg-primary h-10 font-bold btn-hover shadow-lg shadow-primary/20"
              onClick={handlePost}
              disabled={!content.trim() && !audioFile}
            >
              <Send className="w-4 h-4 mr-2" />
              Chirp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOTP} onOpenChange={setShowOTP}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <DialogTitle className="text-2xl font-bold">Verify Audio Posting</DialogTitle>
            <DialogDescription>
              To ensure secure usage, please enter the OTP sent to your registered email to post this audio chirp.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative w-full">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Enter 6-digit OTP" 
                className="pl-10 text-center tracking-[0.5em] text-xl font-bold h-12 rounded-xl" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
              Demo Code: 123456
            </p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20" 
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-5 h-5 mr-2" />
              )}
              Verify & Upload Voice Chirp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
