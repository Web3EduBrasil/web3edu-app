"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { authHeaders } from "@/lib/getIdToken";
import { toast } from "react-toastify";

const studentTypes = [
  { value: "student", label: "Estudante" },
  { value: "developer", label: "Desenvolvedor" },
  { value: "founder", label: "Founder" },
  { value: "professional", label: "Profissional" },
  { value: "curious", label: "Curioso" },
  { value: "other", label: "Outro" },
];

const experienceLevels = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediario" },
  { value: "advanced", label: "Avancado" },
];

export const StudentOnboardingForm = () => {
  const router = useRouter();
  const { googleUserInfo, userDbInfo, setUserDbInfo } = useWeb3AuthContext();
  const uid = googleUserInfo?.uid;

  const detectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const [displayName, setDisplayName] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("pt");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [studentType, setStudentType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [certificateConsent, setCertificateConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userDbInfo?.onboardingCompleted) {
      router.push("/homePage");
      return;
    }
    if (userDbInfo?.displayName) setDisplayName(userDbInfo.displayName);
    if (userDbInfo?.certificateName) setCertificateName(userDbInfo.certificateName);
    if (userDbInfo?.email) setEmail(userDbInfo.email);
    if (userDbInfo?.preferredLanguage) setPreferredLanguage(userDbInfo.preferredLanguage);
    if (userDbInfo?.country) setCountry(userDbInfo.country);
    if (userDbInfo?.timezone) setTimezone(userDbInfo.timezone);
    if (userDbInfo?.studentType) setStudentType(userDbInfo.studentType);
    if (userDbInfo?.experienceLevel) setExperienceLevel(userDbInfo.experienceLevel);
    if (Array.isArray(userDbInfo?.learningGoals)) {
      setLearningGoals(userDbInfo.learningGoals.join(", "));
    }
  }, [userDbInfo, router]);

  const handleSubmit = async () => {
    if (!uid) return;
    if (!displayName.trim() || !certificateName.trim()) {
      toast.error("Preencha nome e nome do certificado.");
      return;
    }
    if (!userDbInfo?.email && !email.trim()) {
      toast.error("Informe um email valido.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy || !certificateConsent) {
      toast.error("Aceite os termos, politica de privacidade e consentimento do certificado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          displayName: displayName.trim(),
          certificateName: certificateName.trim(),
          email: email || null,
          preferredLanguage,
          country: country || null,
          timezone,
          studentType: studentType || null,
          experienceLevel: experienceLevel || null,
          learningGoals: learningGoals
            .split(",")
            .map((goal) => goal.trim())
            .filter(Boolean),
          acceptedTerms,
          acceptedPrivacyPolicy: acceptedPrivacy,
          certificateDataConsent: certificateConsent,
          marketingOptIn,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao concluir onboarding");
      }

      const refresh = await fetch(`/api/user?uid=${uid}`);
      if (refresh.ok) {
        const data = await refresh.json();
        setUserDbInfo(data.user || {});
      }

      toast.success("Onboarding concluido!");
      router.push("/homePage");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full flex items-start justify-center px-5 py-10">
      <div className="w-full max-w-4xl bg-cgray border-2 border-gray rounded-2xl p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-semibold text-neutral">Complete seu cadastro</h1>
        <p className="text-sm text-neutral/70 mt-1">
          Precisamos desses dados para emitir certificados e personalizar sua experiencia.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Nome para exibir</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input input-bordered bg-base-100 text-neutral border-gray"
              placeholder="Seu nome"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Nome no certificado</span>
            <input
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              className="input input-bordered bg-base-100 text-neutral border-gray"
              placeholder="Nome completo"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            <span className="text-neutral/70">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered bg-base-100 text-neutral border-gray"
              placeholder="email@exemplo.com"
              disabled={Boolean(userDbInfo?.email)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Idioma preferido</span>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="select select-bordered bg-base-100 text-neutral border-gray"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Pais</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input input-bordered bg-base-100 text-neutral border-gray"
              placeholder="Brasil"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Fuso horario</span>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input input-bordered bg-base-100 text-neutral border-gray"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Perfil</span>
            <select
              value={studentType}
              onChange={(e) => setStudentType(e.target.value)}
              className="select select-bordered bg-base-100 text-neutral border-gray"
            >
              <option value="">Selecione</option>
              {studentTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral/70">Nivel de experiencia</span>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="select select-bordered bg-base-100 text-neutral border-gray"
            >
              <option value="">Selecione</option>
              {experienceLevels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            <span className="text-neutral/70">Objetivos de aprendizado (separe por virgula)</span>
            <textarea
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              className="textarea textarea-bordered bg-base-100 text-neutral border-gray"
              rows={3}
              placeholder="NFTs, DeFi, smart contracts"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-neutral/80">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>Li e aceito os termos de uso.</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            />
            <span>Aceito a politica de privacidade.</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={certificateConsent}
              onChange={(e) => setCertificateConsent(e.target.checked)}
            />
            <span>Autorizo o uso do meu nome no certificado.</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <span>Quero receber novidades e comunicacoes.</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn w-full mt-6 bg-dblue text-white border-0"
        >
          {isSubmitting ? "Salvando..." : "Concluir onboarding"}
        </button>
      </div>
    </div>
  );
};
