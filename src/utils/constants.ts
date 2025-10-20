export const OTP_EXPIRY_SECONDS = 3 * 60;

export const AUTOFLOW_FREQUENCY = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

export const SAVINGS_CONTRACT_ADDRESS =
  "0x3463617C7e0290077ad1Ba2Ee4872D1Ce6B49024";

export const SAVINGS_VAULT_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "receive",
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "BASIS_POINTS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_DEPOSIT",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_WITHDRAWAL",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "authorizeDelegate",
    inputs: [
      {
        name: "delegatee",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeGoal",
    inputs: [
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "depositFor",
    inputs: [
      {
        name: "beneficiary",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGoal",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct SavingsVault.SavingsGoal",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "targetAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "currentBalance",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "isReached",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "isActive",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGoalBalance",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSavingsProgress",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "current",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "goal",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "percentComplete",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSavingsStatus",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum SavingsVault.SavingsStatus",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserGoalCount",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserSavings",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct SavingsVault.UserSavings",
        components: [
          {
            name: "totalBalance",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalDeposited",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalWithdrawn",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "accountCreatedAt",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastDepositTime",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "lastWithdrawalTime",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "depositCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "withdrawalCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum SavingsVault.SavingsStatus",
          },
          {
            name: "hasAccount",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVaultStats",
    inputs: [],
    outputs: [
      {
        name: "totalSavings",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "userCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "goalExists",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isDelegate",
    inputs: [
      {
        name: "_owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "delegatee",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revokeDelegate",
    inputs: [
      {
        name: "delegatee",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setSavingsGoal",
    inputs: [
      {
        name: "goalAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalSavingsInVault",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalUsers",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawTo",
    inputs: [
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "DelegateAuthorized",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "delegatee",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DelegatedDeposit",
    inputs: [
      {
        name: "depositor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "beneficiary",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DelegatesRevoked",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "delegatee",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DepositMade",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "newBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "EmergencyWithdrawal",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SavingsAccountCreated",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SavingsGoalClosed",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SavingsGoalReached",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "goalAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SavingsGoalSet",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "goalAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SavingsStatusChanged",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "oldStatus",
        type: "uint8",
        indexed: false,
        internalType: "enum SavingsVault.SavingsStatus",
      },
      {
        name: "newStatus",
        type: "uint8",
        indexed: false,
        internalType: "enum SavingsVault.SavingsStatus",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WithdrawalMade",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goalId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "remainingBalance",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__GoalAlreadyExists",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__GoalHasBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__GoalNotActive",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__GoalNotFound",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__InsufficientBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__InvalidAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__InvalidWithdrawalAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__NoSavings",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__NotAuthorized",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__SavingsLocked",
    inputs: [],
  },
  {
    type: "error",
    name: "SavingsVault__TransferFailed",
    inputs: [],
  },
] as const;
