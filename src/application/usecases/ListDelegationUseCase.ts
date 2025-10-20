import winston from "winston";
import { IDelegationRepository } from "../../domain/repositories";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import {
  Delegation,
  isAllowanceDelegation,
  isGroupWalletDelegation,
} from "../../domain/entities";

export interface ListDelegationsRequest {
  userId?: string;
  walletAddress?: string;
  type?: string;
  includeInactive?: boolean;
}

export interface ListDelegationsResponse {
  success: boolean;
  delegations: DelegationSummary[];
  error?: string;
}

export interface DelegationSummary {
  id: string;
  type: string;
  name: string;
  amountLimit: number;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  // Allowance specific
  walletAddress?: string;
  frequency?: string;
  startDate?: Date;
  // Group wallet specific
  memberCount?: number;
  approvalThreshold?: number;
}

export class ListDelegationsUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly delegationRepository: IDelegationRepository,
    config: Env
  ) {
    this.logger = createLogger(ListDelegationsUseCase.name, config);
  }

  async execute(
    request: ListDelegationsRequest
  ): Promise<ListDelegationsResponse> {
    this.logger.debug("Listing delegations", this.sanitizeRequest(request));

    // Validate request
    this.validateRequest(request);

    let delegations: Delegation[] = [];
    let total = 0;

    // 1. Get delegations based on criteria
    if (request.userId) {
      delegations = await this.getDelegationsByUserId(request);
    } else if (request.walletAddress) {
      delegations = await this.getDelegationsByWalletAddress(request);
    } else {
      throw new Error("Either userId or walletAddress must be provided");
    }

    // 2. Apply filters
    delegations = this.applyFilters(delegations, request);

    console.log(delegations.length);

    // 3. Transform to summary format
    const delegationSummaries = delegations.map((delegation) =>
      this.toSummary(delegation)
    );

    console.log(delegationSummaries.length);

    this.logger.info("Delegations listed successfully", {
      count: delegationSummaries.length,
      total,
      userId: request.userId,
      walletAddress: request.walletAddress
        ? `${request.walletAddress.substring(0, 8)}...`
        : undefined,
    });

    return {
      success: true,
      delegations: delegationSummaries,
    };
  }

  private validateRequest(request: ListDelegationsRequest): void {
    if (!request.userId && !request.walletAddress) {
      throw new Error("Either userId or walletAddress must be provided");
    }

    if (request.type && !["allowance", "group_wallet"].includes(request.type)) {
      throw new Error('Type must be either "allowance" or "group_wallet"');
    }
  }

  private async getDelegationsByUserId(
    request: ListDelegationsRequest
  ): Promise<Delegation[]> {
    if (request.type) {
      return await this.delegationRepository.findByType(
        request.userId!,
        request.type as any
      );
    } else {
      return await this.delegationRepository.findByUserId(request.userId!);
    }
  }

  private async getDelegationsByWalletAddress(
    request: ListDelegationsRequest
  ): Promise<Delegation[]> {
    const delegations = await this.delegationRepository.findByWalletAddress(
      request.walletAddress!
    );

    // Filter by type if specified
    if (request.type) {
      return delegations.filter(
        (delegation) => delegation.type === request.type
      );
    }

    return delegations;
  }

  private applyFilters(
    delegations: Delegation[],
    request: ListDelegationsRequest
  ): Delegation[] {
    let filtered = delegations;

    // Filter by active status
    if (!request.includeInactive) {
      filtered = filtered.filter((delegation) =>
        this.isDelegationActive(delegation)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered;
  }

  private isDelegationActive(delegation: Delegation): boolean {
    if (isAllowanceDelegation(delegation)) {
      return delegation.isActive();
    }
    // Group wallet delegations are always considered active
    return true;
  }

  private toSummary(delegation: Delegation): DelegationSummary {
    const baseSummary: DelegationSummary = {
      id: delegation.id,
      type: delegation.type,
      name: delegation.name,
      amountLimit: delegation.amountLimit,
      status: this.getDelegationStatus(delegation),
      createdAt: delegation.createdAt,
    };

    if (isAllowanceDelegation(delegation)) {
      return {
        ...baseSummary,
        walletAddress: delegation.walletAddress,
        frequency: delegation.frequency,
        startDate: delegation.startDate,
      };
    } else if (isGroupWalletDelegation(delegation)) {
      return {
        ...baseSummary,
        memberCount: delegation.members.length,
        approvalThreshold: delegation.approvalThreshold,
      };
    }

    return baseSummary;
  }

  private getDelegationStatus(
    delegation: Delegation
  ): "active" | "inactive" | "pending" {
    if (isAllowanceDelegation(delegation)) {
      return delegation.isActive()
        ? "active"
        : delegation.startDate > new Date()
        ? "pending"
        : "inactive";
    }
    return "active"; // Group wallets are always active
  }

  private sanitizeRequest(
    request: ListDelegationsRequest
  ): Partial<ListDelegationsRequest> {
    return {
      userId: request.userId,
      walletAddress: request.walletAddress
        ? `${request.walletAddress.substring(0, 8)}...`
        : undefined,
      type: request.type,
      includeInactive: request.includeInactive,
    };
  }

  // Specific methods for common use cases

  async listActiveAllowancesByUser(
    userId: string
  ): Promise<ListDelegationsResponse> {
    return this.execute({
      userId,
      type: "allowance",
      includeInactive: false,
    });
  }

  async listGroupWalletsByUser(
    userId: string
  ): Promise<ListDelegationsResponse> {
    return this.execute({
      userId,
      type: "group_wallet",
    });
  }

  async listDelegationsForSendOperation(
    walletAddress: string
  ): Promise<ListDelegationsResponse> {
    return this.execute({
      walletAddress,
      type: "allowance",
      includeInactive: false,
    });
  }

  async listAllDelegationsByUser(
    userId: string
  ): Promise<ListDelegationsResponse> {
    return this.execute({
      userId,
      includeInactive: true,
    });
  }

  // Method to get delegation details for a specific send operation
  async getDelegationForSend(
    walletAddress: string,
    amount: number
  ): Promise<{
    success: boolean;
    delegation?: DelegationSummary;
    error?: string;
    canSend: boolean;
    reason?: string;
  }> {
    try {
      const result = await this.listDelegationsForSendOperation(walletAddress);

      if (!result.success || result.delegations.length === 0) {
        return {
          success: false,
          canSend: false,
          error: "No active delegation found for this wallet address",
        };
      }

      // For send operations, we typically use the first active delegation
      const delegation = result.delegations[0];

      // Check if amount is within limit
      const canSend = amount <= delegation.amountLimit;

      return {
        success: true,
        delegation,
        canSend,
        reason: canSend
          ? undefined
          : `Amount exceeds delegation limit of ${delegation.amountLimit}`,
      };
    } catch (error: any) {
      return {
        success: false,
        canSend: false,
        error: error.message,
      };
    }
  }

  // Method to find delegations that are about to expire or need attention
  async listDelegationsNeedingAttention(
    userId: string
  ): Promise<ListDelegationsResponse> {
    const allDelegations = await this.delegationRepository.findByUserId(userId);

    const needingAttention = allDelegations.filter((delegation) => {
      if (isAllowanceDelegation(delegation)) {
        // Delegations starting in the next 24 hours or recently expired
        const hoursUntilStart =
          (delegation.startDate.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntilStart <= 24 && hoursUntilStart > 0;
      }
      return false;
    });

    const summaries = needingAttention.map((delegation) =>
      this.toSummary(delegation)
    );

    return {
      success: true,
      delegations: summaries,
    };
  }
}
