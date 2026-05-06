import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface VerifyEmailFormProps {
  userId: number;
  email: string;
  onSuccess: () => void;
}

export default function VerifyEmailForm({ userId, email, onSuccess }: VerifyEmailFormProps) {
  const { verifyEmail, resendVerification } = useAuth();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      await verifyEmail({ userId, otp });
      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? "Doğrulama başarısız. Kodu kontrol ediniz.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendMessage(null);
    try {
      await resendVerification(email);
      setResendMessage("Yeni kod e-posta adresinize gönderildi.");
      setOtp("");
    } catch (err: any) {
      setError(err?.message ?? "Kod gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-gray-600">
        <span className="font-medium">{email}</span> adresine 6 haneli bir doğrulama kodu
        gönderdik. Kodun geçerlilik süresi 15 dakikadır.
      </p>

      <div className="flex justify-center py-2">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">{error}</p>}
      {resendMessage && (
        <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md">{resendMessage}</p>
      )}

      <Button
        className="w-full"
        onClick={handleVerify}
        disabled={otp.length !== 6 || isVerifying}
      >
        {isVerifying ? "Doğrulanıyor…" : "Doğrula"}
      </Button>

      <Button
        variant="ghost"
        className="w-full text-sm text-gray-500"
        onClick={handleResend}
        disabled={isResending}
      >
        {isResending ? "Gönderiliyor…" : "Kodu tekrar gönder"}
      </Button>
    </div>
  );
}
