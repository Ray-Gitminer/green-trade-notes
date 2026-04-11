import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LINE_CHANNEL_ID = "2009773284";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast({
        title: "LINE Login ล้มเหลว",
        description: `เกิดข้อผิดพลาด: ${error}`,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleLineLogin = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const callbackUrl = `${supabaseUrl}/functions/v1/line-auth-callback`;
    const state = window.location.origin;

    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code` +
      `&client_id=${LINE_CHANNEL_ID}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=profile%20openid`;

    window.location.href = lineAuthUrl;
  };

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
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            กดปุ่มด้านล่างเพื่อเข้าสู่ระบบด้วยบัญชี LINE ของคุณ
          </p>
          <Button
            onClick={handleLineLogin}
            className="w-full h-12 text-base font-bold text-white hover:opacity-90"
            style={{ backgroundColor: "#06C755" }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            เข้าสู่ระบบด้วย LINE
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
