import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (mode: "login" | "signup") => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: t("auth.validationError"),
        description: t("auth.invalidCredentials"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t("auth.loginFailed"),
            description: t("auth.invalidEmailPassword"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.welcomeBack"),
            description: t("auth.loginSuccess"),
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          const message = error.message.includes("already registered")
            ? t("auth.alreadyRegistered")
            : error.message;
          toast({
            title: t("auth.signUpFailed"),
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.accountCreated"),
            description: t("auth.canStartJournaling"),
          });
          navigate("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background candlestick-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg animate-pulse-glow" />
              <img src={logo} alt="Mae Pla Green Pen" className="relative h-16 w-16 rounded-full object-cover drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            </div>
            <div className="text-left">
              <CardTitle className="text-xl font-bold text-foreground whitespace-nowrap">
                {t("app.title")}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm whitespace-nowrap">
                🐟 {t("app.subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t("auth.signUp")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground">{t("settings.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground">{t("auth.password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit("login")}
                />
              </div>
              <Button
                onClick={() => handleSubmit("login")}
                className="w-full gradient-emerald hover:opacity-90"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("auth.login")}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground">{t("settings.email")}</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground">{t("auth.password")}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit("signup")}
                />
              </div>
              <Button
                onClick={() => handleSubmit("signup")}
                className="w-full gradient-emerald hover:opacity-90"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("auth.createAccount")}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
