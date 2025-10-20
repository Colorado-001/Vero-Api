import winston from "winston";
import {
  IDelegationRepository,
  IUserRepository,
} from "../../domain/repositories";
import { DelegationService } from "../services";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import {
  AllowanceDelegation,
  GroupWalletDelegation,
  DelegationType,
  UserEntity,
} from "../../domain/entities";
import { ICreateDelegationRequest, ICreateDelegationResponse } from "../dto";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { BlockchainAddress } from "../../types/blockchain";

export class CreateDelegationUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly delegateRepo: IDelegationRepository,
    private readonly blockchainDelegationService: DelegationService,
    private readonly userRepository: IUserRepository,
    config: Env
  ) {
    this.logger = createLogger(CreateDelegationUseCase.name, config);
  }

  async execute(
    request: ICreateDelegationRequest
  ): Promise<ICreateDelegationResponse> {
    try {
      this.logger.info("Creating new delegation", {
        type: request.type,
        fromUserId: request.fromUserId,
      });

      // 1. Validate request based on type
      this.validateRequest(request);

      // 2. Get users involved
      const fromUser = await this.userRepository.findById(request.fromUserId);

      if (!fromUser) {
        throw new NotFoundError(
          `Delegator user ${request.fromUserId} not found`
        );
      }

      let domainDelegation;
      let signedBlockchainDelegation;

      // 3. Create domain entity based on type
      if (request.type === DelegationType.ALLOWANCE) {
        domainDelegation = await this.createAllowanceDelegation(
          request,
          fromUser
        );

        const toUser = await this.userRepository.findByAddress(
          request.walletAddress! as BlockchainAddress
        );

        if (!toUser) {
          throw new NotFoundError(`Delegatee user not found`);
        }

        // 4. Create blockchain delegation for allowance type
        signedBlockchainDelegation = await this.createBlockchainDelegation(
          fromUser,
          toUser,
          request.amountLimit.toString(),
          request.startDate!
        );
      } else {
        throw new BadRequestError("Group wallet not supported at this time");
      }

      // 5. Save domain delegation to database
      const savedDelegation = await this.delegateRepo.save(domainDelegation);

      this.logger.info("Delegation created successfully", {
        delegationId: savedDelegation.id,
        type: savedDelegation.type,
        fromUserId: savedDelegation.userId,
      });

      return {
        success: true,
        delegation: savedDelegation.toJSON(),
        signedDelegation: signedBlockchainDelegation,
      };
    } catch (error: any) {
      this.logger.error("Failed to create delegation", {
        error: error.message,
        request: this.sanitizeRequest(request),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private validateRequest(request: ICreateDelegationRequest): void {
    if (!request.name || request.name.trim() === "") {
      throw new Error("Delegation name is required");
    }

    if (request.amountLimit <= 0) {
      throw new Error("Amount limit must be positive");
    }

    if (request.type === DelegationType.ALLOWANCE) {
      if (!request.walletAddress) {
        throw new Error("Wallet address is required for allowance delegation");
      }
      if (!request.frequency) {
        throw new Error("Frequency is required for allowance delegation");
      }
      if (!request.startDate) {
        throw new Error("Start date is required for allowance delegation");
      }
      if (request.startDate < new Date()) {
        throw new Error("Start date cannot be in the past");
      }
    } else if (request.type === DelegationType.GROUP_WALLET) {
      throw new BadRequestError("Group wallet not supported at this time");

      //   if (!request.members || request.members.length === 0) {
      //     throw new Error("At least one member is required for group wallet");
      //   }
      //   if (!request.approvalThreshold || request.approvalThreshold < 1) {
      //     throw new Error(
      //       "Approval threshold is required and must be at least 1"
      //     );
      //   }
      //   if (request.approvalThreshold > request.members.length) {
      //     throw new Error("Approval threshold cannot exceed number of members");
      //   }
    }
  }

  private async createAllowanceDelegation(
    request: ICreateDelegationRequest,
    fromUser: UserEntity
  ): Promise<AllowanceDelegation> {
    this.logger.debug("Creating allowance delegation", {
      walletAddress: request.walletAddress,
      frequency: request.frequency,
      startDate: request.startDate,
    });

    return new AllowanceDelegation({
      type: DelegationType.ALLOWANCE,
      name: request.name,
      userId: fromUser.id,
      amountLimit: request.amountLimit,
      walletAddress: request.walletAddress!,
      frequency: request.frequency!,
      startDate: request.startDate!,
    });
  }

  private async createGroupWalletDelegation(
    request: ICreateDelegationRequest,
    fromUser: UserEntity
  ): Promise<GroupWalletDelegation> {
    this.logger.debug("Creating group wallet delegation", {
      memberCount: request.members?.length,
      approvalThreshold: request.approvalThreshold,
    });

    return new GroupWalletDelegation({
      type: DelegationType.GROUP_WALLET,
      name: request.name,
      userId: fromUser.id,
      amountLimit: request.amountLimit,
      members: request.members!,
      approvalThreshold: request.approvalThreshold!,
    });
  }

  private async createBlockchainDelegation(
    fromUser: UserEntity,
    toUser: UserEntity,
    amount: string,
    startDate: Date
  ): Promise<any> {
    try {
      this.logger.debug("Creating blockchain delegation", {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        amount,
        startDate,
      });

      const signedDelegation =
        await this.blockchainDelegationService.createNewDelegation(
          fromUser,
          toUser,
          amount,
          startDate
        );

      this.logger.debug("Blockchain delegation created successfully");
      return signedDelegation;
    } catch (error: any) {
      this.logger.error("Failed to create blockchain delegation", {
        error: error.message,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
      });
      throw error;
    }
  }

  private sanitizeRequest(
    request: ICreateDelegationRequest
  ): Partial<ICreateDelegationRequest> {
    return {
      type: request.type,
      name: request.name,
      fromUserId: request.fromUserId,
      amountLimit: request.amountLimit,
      // Don't log sensitive data
      walletAddress: request.walletAddress
        ? `${request.walletAddress.substring(0, 8)}...`
        : undefined,
      frequency: request.frequency,
      startDate: request.startDate,
      approvalThreshold: request.approvalThreshold,
    };
  }

  //   async createDailyAllowance(
  //     name: string,
  //     fromUserId: string,
  //     toUserId: string,
  //     walletAddress: string,
  //     dailyAmount: number,
  //     startDate: Date = new Date()
  //   ): Promise<CreateDelegationResponse> {
  //     return this.execute({
  //       type: DelegationType.ALLOWANCE,
  //       name,
  //       fromUserId,
  //       toUserId,
  //       amountLimit: dailyAmount,
  //       walletAddress,
  //       frequency: AllowanceFrequency.DAILY,
  //       startDate,
  //     });
  //   }

  //   async createFamilyWallet(
  //     name: string,
  //     fromUserId: string,
  //     members: Array<{ name: string; address: string }>,
  //     approvalThreshold: number,
  //     totalAmountLimit: number
  //   ): Promise<ICreateDelegationResponse> {
  //     return this.execute({
  //       type: DelegationType.GROUP_WALLET,
  //       name,
  //       fromUserId,
  //       toUserId: fromUserId, // Self for group wallet
  //       amountLimit: totalAmountLimit,
  //       members,
  //       approvalThreshold,
  //     });
  //   }
}
