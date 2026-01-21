
export type StakeholderType = 'Individual' | 'Enterprise/Lender' | 'Neutral';
export type ServiceTrack = 'Negotiation' | 'Mediation' | 'Arbitration';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Immediate Action Required';

export interface FormData {
  stakeholderType: StakeholderType | '';
  serviceTrack: ServiceTrack | '';
  petitionerName: string;
  respondentName: string;
  claimAmount: string;
  description: string;
  urgency: UrgencyLevel | '';
  deadlineDetails: string;
}

export interface SheetPayload {
  petitionerName: string;
  respondentName: string;
  claimValue: string;
  description: string;
  urgencyLevel: string;
  stakeholderType: string;
  requestedService: string;
  deadlineDetails: string;
  smartSummary: string;
}
