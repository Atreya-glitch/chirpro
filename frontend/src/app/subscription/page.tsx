"use client"

import { useState, useEffect } from "react";
import { Check, Shield, Zap, Star, Crown, Clock, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isTimeInRange } from "@/lib/ist-utils";
import { updateStore, Plan, getStore } from "@/lib/store";
import { sendSubscriptionEmail } from "@/ai/flows/send-subscription-email";

const PLANS = [
  { 
    name: 'Free', 
    price: '₹0', 
    tweets: '1 Chirp', 
    icon: Zap, 
    color: 'text-muted-foreground',
    description: 'Perfect for getting started'
  },
  { 
    name: 'Bronze', 
    price: '₹100', 
    tweets: '3 Chirps', 
    icon: Shield, 
    color: 'text-amber-600',
    description: 'For the casual socializer'
  },
  { 
    name: 'Silver', 
    price: '₹300', 
    tweets: '5 Chirps', 
    icon: Star, 
    color: 'text-slate-400',
    description: 'Grow your digital footprint'
  },
  { 
    name: 'Gold', 
    price: '₹1000', 
    tweets: 'Unlimited', 
    icon: Crown, 
    color: 'text-yellow-500',
    description: 'The ultimate professional plan'
  },
];

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [isPayWindow, setIsPayWindow] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan>('Free');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const store = getStore();
      setCurrentPlan(store.subscription);
      // Payment window: 10:00 AM - 11:00 AM IST
      setIsPayWindow(isTimeInRange(10, 11));
    };
    load();
    const interval = setInterval(load, 30000); // Check window every 30s
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('storage', load);
      clearInterval(interval);
    };
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.name === currentPlan) return;

    if (!isPayWindow && plan.name !== 'Free') {
      toast({
        title: "Payment Window Closed",
        description: "Subscription payments are only accepted between 10:00 AM and 11:00 AM IST (Daily).",
        variant: "destructive",
      });
      return;
    }

    setLoading(plan.name);
    try {
      const store = getStore();
      const transactionId = `TXN-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
      
      // Update local state
      updateStore({ subscription: plan.name as Plan });
      setCurrentPlan(plan.name as Plan);

      // Trigger AI simulated email
      const emailResult = await sendSubscriptionEmail({
        email: store.email,
        planName: plan.name,
        price: plan.price,
        transactionId
      });

      toast({
        title: "Subscription Successful!",
        description: `Upgraded to ${plan.name}. An invoice has been sent to ${store.email}.`,
      });

      console.log("Simulated Email Sent:", emailResult);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl font-bold text-foreground tracking-tight">Premium Experience</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Scale your voice with our tailored subscription tiers. 
          Enjoy higher limits and advanced social features.
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
          isPayWindow ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-primary/10 border-primary/20 text-primary'
        } font-medium text-sm`}>
          <Clock className="w-4 h-4" />
          Payment Window: 10:00 AM - 11:00 AM IST {isPayWindow ? '(Open Now)' : '(Closed)'}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PLANS.map((p, idx) => (
          <Card 
            key={p.name} 
            className={`relative flex flex-col h-full border-none shadow-xl ring-1 ring-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
              currentPlan === p.name ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : ''
            }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {currentPlan === p.name && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                Current Plan
              </div>
            )}
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mx-auto p-4 rounded-2xl bg-secondary/50 w-fit mb-4">
                <p.icon className={`w-10 h-10 ${p.color}`} />
              </div>
              <CardTitle className="text-2xl font-bold">{p.name}</CardTitle>
              <p className="text-sm text-muted-foreground min-h-[40px]">{p.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="font-medium text-foreground">{p.tweets} per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-muted-foreground">Premium Support</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-muted-foreground">Ad-free Experience</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pb-8 pt-4">
              <Button 
                className={`w-full rounded-full h-12 font-bold transition-all duration-300 ${
                  currentPlan === p.name 
                    ? 'bg-secondary text-secondary-foreground cursor-default' 
                    : 'bg-primary hover:bg-primary/90 btn-hover shadow-lg shadow-primary/20'
                }`} 
                onClick={() => handleSubscribe(p)}
                variant={currentPlan === p.name ? 'secondary' : 'default'}
                disabled={!!loading}
              >
                {loading === p.name ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {currentPlan === p.name ? 'Active' : `Upgrade to ${p.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
