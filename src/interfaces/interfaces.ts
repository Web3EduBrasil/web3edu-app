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
  ipfs: string;
  createdAt: Date;
  openseaUrl: string;
}
