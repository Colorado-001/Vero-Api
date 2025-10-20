import { AllowanceFrequency, DelegationType } from "../../domain/entities";

export interface ICreateDelegationRequest {
  type: DelegationType;
  name: string;
  fromUserId: string;
  amountLimit: number;
  // Allowance-specific fields
  walletAddress?: string;
  frequency?: AllowanceFrequency;
  startDate?: Date;
  // Group wallet-specific fields
  members?: Array<{ name: string; address: string }>;
  approvalThreshold?: number;
}

export interface ICreateDelegationResponse {
  success: boolean;
  delegation?: any;
  signedDelegation?: any;
  error?: string;
}
