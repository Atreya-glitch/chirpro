
"use client"

import { useState, useEffect } from "react";
import { TweetComposer } from "@/components/tweets/TweetComposer";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export default function Home() {
  const [tweets, setTweets] = useState<any[]>([]);
  const { checkFeedForNotifications } = useNotifications();

  const loadTweets = () => {
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('chirppro_tweets') || '[]');
      setTweets(saved);
    }
  };

  useEffect(() => {
    loadTweets();
    
    const interval = setInterval(loadTweets, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tweets.length > 0) {
      checkFeedForNotifications(tweets);
    }
  }, [tweets, checkFeedForNotifications]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <TweetComposer onTweetCreated={loadTweets} />

      <div className="space-y-4">
        {tweets.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold text-foreground/80">No chirps yet. Be the first to start the conversation!</p>
            <p className="text-sm mt-2 opacity-50 italic">Try chirping about "cricket" or "science" to see browser notifications.</p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <Card key={tweet.id} className="border-none shadow-sm ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Avatar className="ring-2 ring-primary/10">
                  <AvatarImage src={`https://picsum.photos/seed/${tweet.id}/100/100`} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">{tweet.author[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{tweet.author.split('@')[0]}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-4 bg-primary/5 text-primary border-primary/10">PRO</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(tweet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
                {tweet.type === 'audio' && (
                  <div className="mt-4 p-4 bg-accent/5 rounded-2xl flex items-center gap-3 border border-accent/10">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                      <Heart className="w-4 h-4 text-white fill-current" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-accent uppercase tracking-tighter">
                        <span>Audio Chirp</span>
                        <span>0:45</span>
                      </div>
                      <div className="h-1.5 bg-accent/20 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-accent" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-5 text-muted-foreground border-t border-border/50 pt-3">
                  <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/5 rounded-full px-4">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="text-xs font-bold">12</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-destructive hover:bg-destructive/5 rounded-full px-4">
                    <Heart className="w-4 h-4 mr-2" />
                    <span className="text-xs font-bold">45</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-accent hover:bg-accent/5 rounded-full">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
