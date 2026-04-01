
"use client"

import { useEffect, useState } from "react";
import { getStore, updateStore, UserState } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { History, Shield, Smartphone, Monitor, Laptop, BellRing, Globe, Mail, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const LANGUAGES = [
  { name: 'English', flag: '🇺🇸' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'Portuguese', flag: '🇵🇹' },
  { name: 'Chinese', flag: '🇨🇳' }
];

export default function ProfilePage() {
  const [user, setUser] = useState<UserState | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSession, setOtpSession] = useState<{ sessionId: string; method: string; target: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getStore());
  }, []);

  const handleLanguageSelect = async (lang: string) => {
    if (lang === user?.language) {
      setIsLangModalOpen(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/language/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
      
      const data = await response.json();
      if (data.success) {
        setOtpSession({ sessionId: data.sessionId, method: data.method, target: data.target });
        setSelectedLang(lang);
        setIsLangModalOpen(false);
        setIsOtpModalOpen(true);
        if (data.simulatedOtp) {
          toast({ title: "SIMULATION", description: `Mobile OTP: ${data.simulatedOtp}` });
        }
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Connection failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpSession) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/language/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: otpSession.sessionId, otp }),
      });
      
      const data = await response.json();
      if (data.success) {
        updateStore({ language: data.language });
        setUser(prev => prev ? { ...prev, language: data.language } : null);
        setIsOtpModalOpen(false);
        setOtp('');
        toast({ title: "Success", description: `Language changed to ${data.language}` });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Verification failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (val: boolean) => {
    updateStore({ notificationsEnabled: val });
    setUser(prev => prev ? { ...prev, notificationsEnabled: val } : null);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-4 h-4 text-primary" />;
      case 'laptop': return <Laptop className="w-4 h-4 text-primary" />;
      default: return <Monitor className="w-4 h-4 text-primary" />;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 glass rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <Badge variant="outline" className="border-accent/20 text-accent bg-accent/5 px-4 py-1">
            <Globe className="w-3 h-3 mr-2" />
            Active Language: {user.language}
          </Badge>
        </div>
        
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-inner ring-2 ring-primary/20">
          <span className="text-5xl font-bold text-primary">{user.email[0].toUpperCase()}</span>
        </div>
        
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{user.email.split('@')[0]}</h1>
          <div className="flex flex-col sm:flex-row gap-3 text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {user.phone}</span>
          </div>
          <div className="flex justify-center md:justify-start gap-2 pt-2">
            <span className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
              {user.subscription} Member
            </span>
            <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest border border-accent/20">
              {user.language} User
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg ring-1 ring-border rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BellRing className="w-5 h-5 text-primary" />
              Engagement Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-3xl border border-border/50">
              <div className="space-y-1">
                <Label className="text-base font-bold">Keyword Alerts</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">Notifications for "cricket" or "science" chirps in your selected language.</p>
              </div>
              <Switch checked={user.notificationsEnabled} onCheckedChange={toggleNotifications} />
            </div>
            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Locale</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-accent">{user.language}</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase font-bold text-primary hover:bg-primary/10" onClick={() => setIsLangModalOpen(true)}>
                    Change
                  </Button>
                </div>
              </div>
              <Globe className="w-10 h-10 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Dialog open={isLangModalOpen} onOpenChange={setIsLangModalOpen}>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Select Language</DialogTitle>
              <DialogDescription>
                Changing your language requires a security verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {LANGUAGES.map((lang) => (
                <Button
                  key={lang.name}
                  variant={user.language === lang.name ? "default" : "outline"}
                  className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02]"
                  onClick={() => handleLanguageSelect(lang.name)}
                  disabled={loading}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs font-bold">{lang.name}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Verify Identity</DialogTitle>
              <DialogDescription>
                We've sent a 6-digit code to your {otpSession?.method === 'email' ? 'email' : 'mobile'}: 
                <strong className="block text-foreground mt-1">{otpSession?.target}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <Input
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-16 text-center text-3xl font-black tracking-[1rem] rounded-2xl border-2 focus-visible:ring-primary"
              />
              <Button 
                className="w-full h-14 rounded-2xl bg-primary text-lg font-bold shadow-lg shadow-primary/20" 
                onClick={verifyOtp}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? "Verifying..." : "Confirm Language Switch"}
              </Button>
            </div>
            <DialogFooter className="sm:justify-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Security Policy: OTP valid for 10 minutes
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-lg ring-1 ring-border rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-primary" />
              Account Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 bg-secondary/50 rounded-3xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Social Impact</p>
                  <span className="font-black text-3xl text-primary">{user.tweetCount}</span>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    Status: Verified
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg ring-1 ring-border rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Security Audit Log
          </CardTitle>
          <p className="text-xs text-muted-foreground">Detailed transparency report for your login sessions and security events.</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-none">
                <TableHead className="w-[100px] font-bold">DEVICE</TableHead>
                <TableHead className="font-bold">BROWSER</TableHead>
                <TableHead className="font-bold">OS</TableHead>
                <TableHead className="font-bold">IP ORIGIN</TableHead>
                <TableHead className="text-right font-bold">TIMESTAMP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.loginHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    No security events recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                user.loginHistory.map((session) => (
                  <TableRow key={session.id} className="hover:bg-muted/20 border-border/50 transition-colors">
                    <TableCell className="flex items-center gap-2 capitalize py-4">
                      {getDeviceIcon(session.device)}
                      <span className="text-xs font-bold">{session.device}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground/80">{session.browser}</TableCell>
                    <TableCell className="text-xs">{session.os}</TableCell>
                    <TableCell className="font-mono text-[10px] text-primary">{session.ip}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {new Date(session.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
