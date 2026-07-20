import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";
import type {
  StudentProfile,
  PreferredLanguage,
  ExperienceLevel,
  StudentType,
} from "@/interfaces/interfaces";

const walletRegex = /^0x[0-9a-fA-F]{40}$/;

type PartialProfile = Partial<StudentProfile> & {
  walletProvider?: string | null;
};

const stripUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  );

export const normalizeWalletAddress = (address?: string | null): string | null => {
  if (!address || typeof address !== "string") return null;
  const trimmed = address.trim();
  if (!walletRegex.test(trimmed)) return null;
  return trimmed.toLowerCase();
};

export const getStudentProfile = async (uid: string) => {
  const doc = await adminDb.collection("users").doc(uid).get();
  return doc.exists ? (doc.data() as StudentProfile) : null;
};

export const createBaseStudentProfile = (params: {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
  certificateName?: string | null;
  photoURL?: string | null;
  walletAddress?: string | null;
  walletProvider?: string | null;
  preferredLanguage?: PreferredLanguage;
  timezone?: string | null;
}): StudentProfile => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const walletAddressLowercase = normalizeWalletAddress(params.walletAddress) || "";

  return {
    uid: params.uid,
    email: params.email ?? null,
    emailVerified: params.emailVerified ?? false,
    walletAddress: params.walletAddress ?? null,
    walletAddressLowercase,
    walletProvider: params.walletProvider ?? null,
    displayName: params.displayName ?? "",
    certificateName: params.certificateName ?? params.displayName ?? "",
    photoURL: params.photoURL ?? null,
    country: null,
    preferredLanguage: params.preferredLanguage ?? "pt",
    timezone: params.timezone ?? null,
    studentType: null,
    experienceLevel: null,
    learningGoals: [],
    acceptedTermsAt: null,
    acceptedPrivacyPolicyAt: null,
    certificateDataConsent: false,
    marketingOptIn: false,
    onboardingCompleted: false,
    createdAt: now as unknown as StudentProfile["createdAt"],
    updatedAt: now as unknown as StudentProfile["updatedAt"],
  };
};

const ensureWalletIndex = async (
  uid: string,
  walletAddressLowercase: string,
  walletProvider?: string | null
) => {
  if (!walletAddressLowercase) return;

  const indexRef = adminDb.collection("walletIndex").doc(walletAddressLowercase);
  const indexSnap = await indexRef.get();
  if (indexSnap.exists) {
    const existingUid = indexSnap.data()?.uid;
    if (existingUid && existingUid !== uid) {
      throw new Error("WALLET_ALREADY_LINKED");
    }
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await indexRef.set(
    {
      uid,
      updatedAt: now,
      createdAt: indexSnap.exists ? indexSnap.data()?.createdAt : now,
    },
    { merge: true }
  );

  const walletRef = adminDb
    .collection("users")
    .doc(uid)
    .collection("wallets")
    .doc(walletAddressLowercase);

  await walletRef.set(
    {
      walletAddress: walletAddressLowercase,
      walletProvider: walletProvider ?? null,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );
};

export const upsertStudentProfile = async (uid: string, data: PartialProfile) => {
  const docRef = adminDb.collection("users").doc(uid);
  const existing = await docRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const walletAddressLowercase = normalizeWalletAddress(
    data.walletAddress ?? data.walletAddressLowercase ?? null
  );

  if (walletAddressLowercase) {
    await ensureWalletIndex(uid, walletAddressLowercase, data.walletProvider ?? null);
  }

  const existingOnboarded =
    existing.exists && (existing.data() as any)?.onboardingCompleted === true;

  const payload = stripUndefined({
    ...data,
    uid,
    walletAddressLowercase: walletAddressLowercase || data.walletAddressLowercase || null,
    // Never downgrade onboardingCompleted from true to false/undefined
    onboardingCompleted:
      existingOnboarded && data.onboardingCompleted !== true
        ? undefined
        : data.onboardingCompleted,
    updatedAt: now,
    createdAt: existing.exists ? undefined : now,
  });

  await docRef.set(payload, { merge: true });
  return payload as unknown as StudentProfile;
};

export const completeOnboarding = async (
  uid: string,
  data: {
    displayName: string;
    certificateName: string;
    email?: string | null;
    preferredLanguage?: PreferredLanguage;
    country?: string | null;
    timezone?: string | null;
    studentType?: StudentType | null;
    experienceLevel?: ExperienceLevel | null;
    learningGoals?: string[];
    certificateDataConsent: boolean;
    marketingOptIn?: boolean;
    acceptedTermsAt: string;
    acceptedPrivacyPolicyAt: string;
  }
) => {
  return upsertStudentProfile(uid, {
    ...data,
    onboardingCompleted: true,
  });
};
