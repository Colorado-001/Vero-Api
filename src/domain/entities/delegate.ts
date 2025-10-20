export enum DelegationType {
  ALLOWANCE = "allowance",
  GROUP_WALLET = "group_wallet",
}

export enum AllowanceFrequency {
  DAILY = "Daily",
}

export interface DelegationMember {
  name: string;
  address: string;
}

// Base interface
export interface IDelegationProps {
  id?: string;
  type: DelegationType;
  name: string;
  userId: string;
  amountLimit: number;
  signedBlockchainDelegation?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Allowance-specific
export interface IAllowanceDelegationProps extends IDelegationProps {
  type: DelegationType.ALLOWANCE;
  walletAddress: string;
  frequency: AllowanceFrequency;
  startDate: Date;
}

// Group wallet-specific
export interface IGroupWalletDelegationProps extends IDelegationProps {
  type: DelegationType.GROUP_WALLET;
  members: DelegationMember[];
  approvalThreshold: number;
}

export type DelegationProps =
  | IAllowanceDelegationProps
  | IGroupWalletDelegationProps;

export abstract class DelegationBase {
  protected _id: string;
  protected _type: DelegationType;
  protected _name: string;
  protected _userId: string;
  protected _amountLimit: number;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _signedBlockchainDelegation: any;

  constructor(props: IDelegationProps) {
    this._id = props.id || this.generateId();
    this._type = props.type;
    this._name = props.name;
    this._userId = props.userId;
    this._amountLimit = props.amountLimit;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._signedBlockchainDelegation = props.signedBlockchainDelegation;
    this.validate();
  }

  private generateId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected validate(): void {
    if (!this._name || this._name.trim() === "") {
      throw new Error("Delegation name is required");
    }
    if (!this._userId || this._userId.trim() === "") {
      throw new Error("User ID is required");
    }
    if (this._amountLimit <= 0) {
      throw new Error("Amount limit must be positive");
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get type(): DelegationType {
    return this._type;
  }
  get name(): string {
    return this._name;
  }
  get userId(): string {
    return this._userId;
  }
  get amountLimit(): number {
    return this._amountLimit;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get signedBlockchainDelegation(): any {
    return this._signedBlockchainDelegation;
  }

  // Business methods
  public updateSignedData(data: any) {
    this._signedBlockchainDelegation = data;
    this._updatedAt = new Date();
  }

  public updateAmountLimit(newLimit: number): void {
    if (newLimit <= 0) {
      throw new Error("Amount limit must be positive");
    }
    this._amountLimit = newLimit;
    this._updatedAt = new Date();
  }

  public updateName(newName: string): void {
    if (!newName || newName.trim() === "") {
      throw new Error("Name cannot be empty");
    }
    this._name = newName;
    this._updatedAt = new Date();
  }

  public abstract toJSON(): object;
}

export class AllowanceDelegation extends DelegationBase {
  private _walletAddress: string;
  private _frequency: AllowanceFrequency;
  private _startDate: Date;

  constructor(props: IAllowanceDelegationProps, validate: boolean = true) {
    super(props);
    this._walletAddress = props.walletAddress;
    this._frequency = props.frequency;
    this._startDate = props.startDate;

    if (validate) this.validateAllowance();
  }

  private validateAllowance(): void {
    if (!this._walletAddress || this._walletAddress.trim() === "") {
      throw new Error("Wallet address is required for allowance delegation");
    }
    if (!this._walletAddress.startsWith("0x")) {
      throw new Error("Wallet address must start with 0x");
    }
    // if (this._startDate < new Date()) {
    //   throw new Error("Start date cannot be in the past");
    // }
  }

  // Getters
  get walletAddress(): string {
    return this._walletAddress;
  }
  get frequency(): AllowanceFrequency {
    return this._frequency;
  }
  get startDate(): Date {
    return this._startDate;
  }

  // Business methods
  public updateWalletAddress(newAddress: string): void {
    if (!newAddress.startsWith("0x")) {
      throw new Error("Wallet address must start with 0x");
    }
    this._walletAddress = newAddress;
    this._updatedAt = new Date();
  }

  public updateFrequency(newFrequency: AllowanceFrequency): void {
    this._frequency = newFrequency;
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._startDate <= new Date();
  }

  public toJSON(): object {
    return {
      id: this._id,
      type: this._type,
      name: this._name,
      userId: this._userId,
      amountLimit: this._amountLimit,
      walletAddress: this._walletAddress,
      frequency: this._frequency,
      startDate: this._startDate,
      isActive: this.isActive(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

export class GroupWalletDelegation extends DelegationBase {
  private _members: DelegationMember[];
  private _approvalThreshold: number;

  constructor(props: IGroupWalletDelegationProps) {
    super(props);
    this._members = props.members;
    this._approvalThreshold = props.approvalThreshold;
    this.validateGroupWallet();
  }

  private validateGroupWallet(): void {
    if (!this._members || this._members.length === 0) {
      throw new Error("At least one member is required for group wallet");
    }
    if (
      this._approvalThreshold < 1 ||
      this._approvalThreshold > this._members.length
    ) {
      throw new Error(
        "Approval threshold must be between 1 and number of members"
      );
    }

    // Validate unique addresses
    const addresses = this._members.map((m) => m.address);
    const uniqueAddresses = new Set(addresses);
    if (uniqueAddresses.size !== addresses.length) {
      throw new Error("Member addresses must be unique");
    }
  }

  // Getters
  get members(): DelegationMember[] {
    return [...this._members];
  }
  get approvalThreshold(): number {
    return this._approvalThreshold;
  }

  // Business methods
  public addMember(member: DelegationMember): void {
    if (this._members.some((m) => m.address === member.address)) {
      throw new Error("Member with this address already exists");
    }
    this._members.push(member);
    this._updatedAt = new Date();
  }

  public removeMember(address: string): void {
    const initialLength = this._members.length;
    this._members = this._members.filter((m) => m.address !== address);

    if (this._members.length === initialLength) {
      throw new Error("Member not found");
    }

    // Adjust threshold if needed
    if (this._approvalThreshold > this._members.length) {
      this._approvalThreshold = this._members.length;
    }

    this._updatedAt = new Date();
  }

  public updateApprovalThreshold(newThreshold: number): void {
    if (newThreshold < 1 || newThreshold > this._members.length) {
      throw new Error(
        "Approval threshold must be between 1 and number of members"
      );
    }
    this._approvalThreshold = newThreshold;
    this._updatedAt = new Date();
  }

  public canApprove(approvalsCount: number): boolean {
    return approvalsCount >= this._approvalThreshold;
  }

  public toJSON(): object {
    return {
      id: this._id,
      type: this._type,
      name: this._name,
      userId: this._userId,
      amountLimit: this._amountLimit,
      members: this._members,
      approvalThreshold: this._approvalThreshold,
      totalMembers: this._members.length,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

// Union type for all delegation types
export type Delegation = AllowanceDelegation | GroupWalletDelegation;

// Type guards
export const isAllowanceDelegation = (
  delegation: Delegation
): delegation is AllowanceDelegation => {
  return delegation.type === DelegationType.ALLOWANCE;
};

export const isGroupWalletDelegation = (
  delegation: Delegation
): delegation is GroupWalletDelegation => {
  return delegation.type === DelegationType.GROUP_WALLET;
};
