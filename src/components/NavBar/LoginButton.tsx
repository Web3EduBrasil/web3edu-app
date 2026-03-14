"use client";

import { useState } from "react";
import { MotionButton } from "../ui/Button";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";

export const LoginButton = () => {
  const { login, loginWithEmail, resetPassword } = useWeb3AuthContext();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast.error("Erro ao entrar com Google");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (error: any) {
      const msg =
        error?.code === "auth/wrong-password"
          ? "Senha incorreta"
          : error?.code === "auth/invalid-email"
            ? "E-mail inválido"
            : "Erro ao entrar. Verifique suas credenciais.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setShowForgot(false);
      setForgotEmail("");
    } catch (error: any) {
      const msg =
        error?.code === "auth/user-not-found"
          ? "Nenhuma conta encontrada com este e-mail."
          : error?.code === "auth/invalid-email"
            ? "E-mail inválido."
            : "Erro ao enviar o e-mail de recuperação.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-end gap-2">
      {!showEmailForm ? (
        <div className="flex gap-2">
          <MotionButton
            label="Google"
            func={handleGoogleLogin}
            type="button"
            Icon={FcGoogle}
            className="text-white bg-dblue border rounded-xl gap-2"
          />
          <MotionButton
            label="E-mail"
            func={() => setShowEmailForm(true)}
            type="button"
            Icon={MdEmail}
            className="text-white bg-dblue border rounded-xl gap-2"
          />
        </div>
      ) : showForgot ? (
        <form
          onSubmit={handleForgotPassword}
          className="flex flex-col gap-2 bg-cgray p-4 rounded-box shadow-lg min-w-64"
        >
          <p className="font-semibold text-neutral text-sm">Recuperar senha</p>
          <p className="text-xs text-dgray">Enviaremos um e-mail com instruções para redefinir sua senha.</p>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            className="input input-bordered input-sm w-full"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm bg-green text-neutral flex-1"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="btn btn-sm btn-ghost flex-1"
            >
              Voltar
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleEmailLogin}
          className="flex flex-col gap-2 bg-cgray p-4 rounded-box shadow-lg min-w-64"
        >
          <p className="font-semibold text-neutral text-sm">Entrar com e-mail</p>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input input-bordered input-sm w-full"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input input-bordered input-sm w-full"
          />
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-dblue hover:underline text-left"
          >
            Esqueci minha senha
          </button>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm bg-green text-neutral flex-1"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="btn btn-sm btn-ghost flex-1"
            >
              Voltar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

