import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { registerSchema, type RegisterData } from "@/lib/authSchemas";
import { useAuth } from "@/hooks/useAuth";
import { UNIVERSITIES } from "@/lib/universities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegisterFormProps {
  onSuccess: (userId: number, email: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      university: "",
      captchaToken: "",
    },
  });

  const onSubmit = async (data: RegisterData) => {
    setServerError(null);
    try {
      const { userId } = await register(data);
      onSuccess(userId, data.email);
    } catch (err: any) {
      setServerError(err?.message ?? "Kayıt başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="reg-username">Kullanıcı Adı</Label>
        <Input
          id="reg-username"
          placeholder="kullanici_adi"
          {...form.register("username")}
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">E-posta</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="ornek@email.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-dob">Doğum Tarihi</Label>
        <Input id="reg-dob" type="date" {...form.register("dateOfBirth")} />
        {form.formState.errors.dateOfBirth && (
          <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Üniversite</Label>
        <Select
          onValueChange={(val) => form.setValue("university", val, { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Üniversitenizi seçin" />
          </SelectTrigger>
          <SelectContent>
            {UNIVERSITIES.length === 0 ? (
              <SelectItem value="__empty__" disabled>
                Üniversite listesi henüz eklenmedi
              </SelectItem>
            ) : (
              UNIVERSITIES.map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.university && (
          <p className="text-sm text-red-500">{form.formState.errors.university.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Şifre</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm">Şifre Tekrar</Label>
        <Input
          id="reg-confirm"
          type="password"
          placeholder="••••••••"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="pt-1">
        <Turnstile
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) =>
            form.setValue("captchaToken", token, { shouldValidate: true })
          }
          onError={() => form.setValue("captchaToken", "", { shouldValidate: true })}
          onExpire={() => form.setValue("captchaToken", "", { shouldValidate: true })}
        />
        {form.formState.errors.captchaToken && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.captchaToken.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Kayıt yapılıyor…" : "Kayıt Ol"}
      </Button>
    </form>
  );
}
