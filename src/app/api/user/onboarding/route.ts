import { completeOnboarding } from "@/lib/student-profile";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const body = await req.json();
    const {
      displayName,
      certificateName,
      email,
      preferredLanguage,
      country,
      timezone,
      studentType,
      experienceLevel,
      learningGoals,
      acceptedTerms,
      acceptedPrivacyPolicy,
      certificateDataConsent,
      marketingOptIn,
    } = body || {};

    if (!displayName || !certificateName) {
      return NextResponse.json(
        { message: "displayName e certificateName são obrigatórios" },
        { status: 400 }
      );
    }

    if (!acceptedTerms || !acceptedPrivacyPolicy || !certificateDataConsent) {
      return NextResponse.json(
        { message: "Aceites obrigatórios não confirmados" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    await completeOnboarding(verifiedUid, {
      displayName,
      certificateName,
      email: email ?? null,
      preferredLanguage,
      country: country ?? null,
      timezone: timezone ?? null,
      studentType: studentType ?? null,
      experienceLevel: experienceLevel ?? null,
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      certificateDataConsent: Boolean(certificateDataConsent),
      marketingOptIn: Boolean(marketingOptIn),
      acceptedTermsAt: nowIso,
      acceptedPrivacyPolicyAt: nowIso,
    });

    return NextResponse.json(
      { message: "Onboarding concluído com sucesso" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({
      message: "Internal Server Error",
      error: error.message,
    }, { status: 500 });
  }
};
