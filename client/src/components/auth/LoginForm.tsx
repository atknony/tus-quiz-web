import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/lib/authSchemas";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginData) => {
    setServerError(null);
    try {
      await login(data);
      onSuccess();
    } catch (err: any) {
      setServerError(err?.message ?? "Giriş başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-caption text-muted-foreground">
          E-posta veya Kullanıcı Adı
        </Label>
        <Input
          id="login-email"
          type="text"
          placeholder="ornek@email.com"
          className="bg-background border-border focus-visible:border-border-strong"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-caption text-danger">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-caption text-muted-foreground">
          Şifre
        </Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="bg-background border-border focus-visible:border-border-strong"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-caption text-danger">{form.formState.errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <SurfaceCard variant="inset" tone="danger" padding="sm">
          <p className="text-caption text-danger">{serverError}</p>
        </SurfaceCard>
      )}

      <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}
