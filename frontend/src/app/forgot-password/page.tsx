
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generatePassword } from "@/ai/flows/ai-generated-password-reset";
import { getStore, updateStore } from "@/lib/store";
import { RefreshCw, Key, ArrowLeft, Copy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    const store = getStore();
    const today = new Date().toDateString();

    if (store.lastPasswordReset === today) {
      setHasError(true);
      toast({
        title: "Daily Limit Reached",
        description: "You can use this option only one time per day.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasError(false);
    try {
      const result = await generatePassword();
      setGeneratedPassword(result.password);
      updateStore({ lastPasswordReset: today });
      toast({ title: "Success", description: "Your new secure password has been generated!" });
    } catch {
      toast({ title: "Error", description: "Failed to generate password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({ title: "Copied!", description: "Password copied to clipboard." });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md border-none shadow-2xl ring-1 ring-border overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader>
          <Link href="/login" className="flex items-center gap-1 text-sm text-primary hover:underline mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            Reset Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your registered email or phone number to generate a new secure password.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasError && (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Restricted</AlertTitle>
              <AlertDescription>
                You can use this option only one time per day. Please try again tomorrow.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Input 
              placeholder="Email or Phone Number" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={!!generatedPassword || hasError}
              className="h-11 rounded-xl"
            />
          </div>
          
          {generatedPassword && (
            <div className="p-6 bg-secondary/50 rounded-2xl border-2 border-dashed border-primary/20 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Your New Password</p>
                <p className="text-3xl font-mono font-bold tracking-tight text-foreground select-all">{generatedPassword}</p>
              </div>
              <Button variant="outline" className="w-full bg-background rounded-full" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" /> Copy Password
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                This password contains only letters (a-z, A-Z) as requested.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!generatedPassword ? (
            <Button 
              className="w-full bg-primary h-12 rounded-full btn-hover shadow-lg shadow-primary/20 text-lg font-semibold" 
              onClick={handleReset}
              disabled={loading || !identifier || hasError}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Key className="w-5 h-5 mr-2" />
              )}
              Generate Secure Password
            </Button>
          ) : (
            <Button className="w-full h-12 rounded-full bg-accent hover:bg-accent/90" asChild>
              <Link href="/login">Return to Sign In</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
