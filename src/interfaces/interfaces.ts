export interface MotionButtonProps<T> {
  label: string;
  type: "button" | "submit" | "reset";
  className?: string;
  rightIcon?: boolean;
  Icon?: React.ComponentType<{ className: string }> | string;
  func: (param: T) => T;
}

export interface AiAnswerProps {
  explicacao: string;
  valido: boolean;
}

export interface IconButtonProps<T> {
  func: (param: T) => T;
  className?: string;
  Icon: React.ComponentType<{ className: string }>;
}

export interface MotionDiv<T> {
  className?: string;
  func?: (param: T) => T;
  children: React.ReactNode;
}

export interface LearnProps {
  trailIdRt: string;
  sectionId: string;
}

export interface ProgramProps {
  programId: string;
}

export interface ProgramContainerProps {
  programId: string;
  banner: string;
  description: string;
  estimatedTime: number;
  requirements: { trailPercentage?: number; trailName?: string };
  title: string;
}

export interface Interests {
  crypto: boolean;
  blockchain: boolean;
  rwa: boolean;
  smartcontracts: boolean;
  defi: boolean;
}

export interface Kyc1Props<T> {
  setLevel: React.Dispatch<React.SetStateAction<string>>;
  level: string;
  handleTabClick: (param: string) => T;
}

export interface Kyc2Props<T> {
  interests: Interests;
  setInterests: React.Dispatch<React.SetStateAction<Interests>>;
  handleTabClick: (param: string) => T;
  fetchKyc: () => Promise<void>;
}

export interface KycIntroProps<T> {
  handleTabClick: (param: string) => T;
}

export interface OnboardingProps<T> {
  handleTabClick: (param: string) => T;
}

export interface ObIntro<T> {
  handleTabClick: (param: string) => T;
}

export interface HandleScreenProps {
  activeTab: string;
}

export interface TaskUnitsProps {
  text: string;
  id: string;
  trailId: string;
  done: boolean;
  index: number;
}

export interface TrailsPageProps {
  id: string;
  image: string;
  title: string;
  description: string;
  percentage?: number;
}

export interface TrailCardHomeProps {
  Icon?: React.ComponentType<{ className: string }> | string;
  text: string;
  progress: number;
  trailId: string;
}

export interface TrailSectionData<T> {
  contents: Array<T>;
}

export interface Trail {
  banner?: string;
  categories: string[];
  introVideo: string;
  createdAt: { seconds: number; nanoseconds: number };
  description: string;
  estimatedTime: number;
  name: string;
  topics: string[];
  trailId: string;
}

export interface AchievedNft {
  walletAddress: string;
  trailId: string;
  ipfsHash: string;
  imageUrl: string;
  certificateUrl: string;
  createdAt: Date;
  type?: "trail" | "program";
  certificateName?: string;
}

export type PreferredLanguage = "pt" | "en";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type StudentType =
  | "student"
  | "developer"
  | "founder"
  | "professional"
  | "curious"
  | "other";

export interface StudentProfile {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  walletAddress: string | null;
  walletAddressLowercase: string | null;
  walletProvider: string | null;
  displayName: string;
  certificateName: string;
  photoURL: string | null;
  country: string | null;
  preferredLanguage: PreferredLanguage | null;
  timezone: string | null;
  studentType: StudentType | null;
  experienceLevel: ExperienceLevel | null;
  learningGoals: string[];
  acceptedTermsAt: string | null;
  acceptedPrivacyPolicyAt: string | null;
  certificateDataConsent: boolean;
  marketingOptIn: boolean;
  onboardingCompleted: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}
