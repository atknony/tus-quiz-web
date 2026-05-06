import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import VerifyEmailForm from "./VerifyEmailForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const [pendingVerification, setPendingVerification] = useState<{
    userId: number;
    email: string;
  } | null>(null);

  const handleRegistrationSuccess = (userId: number, email: string) => {
    setPendingVerification({ userId, email });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setPendingVerification(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {pendingVerification ? (
          <>
            <DialogHeader>
              <DialogTitle>E-posta Doğrulama</DialogTitle>
            </DialogHeader>
            <VerifyEmailForm
              userId={pendingVerification.userId}
              email={pendingVerification.email}
              onSuccess={() => {
                setPendingVerification(null);
                onOpenChange(false);
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>TUS Quiz Hesabı</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSuccess={() => onOpenChange(false)} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onSuccess={handleRegistrationSuccess} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
