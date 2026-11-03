export type ShellUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isDemo: boolean;
  isAdmin: boolean;
};

export type DueFollowUp = {
  id: string;
  companyName: string;
  position: string;
  nextFollowUpAt: string;
};

export type ShellData = {
  totalApplications: number;
  dueCount: number;
  inboundRecent: number;
  interviewCount: number;
  notificationCount: number;
  dueFollowUps: DueFollowUp[];
};

export type SearchResult = {
  id: string;
  reference: string;
  companyName: string;
  position: string;
  contactName: string | null;
  status: string;
};
