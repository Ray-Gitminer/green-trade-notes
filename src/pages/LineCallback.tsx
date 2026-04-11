import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function LineCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "magiclink" | "email";

      if (!tokenHash || !type) {
        setError("Invalid callback parameters");
        setTimeout(() => navigate("/auth"), 2000);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type === "magiclink" ? "magiclink" : "email",
      });

      if (error) {
        console.error("OTP verification error:", error);
        setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">กำลังเข้าสู่ระบบด้วย LINE...</p>
        </>
      )}
    </div>
  );
}
