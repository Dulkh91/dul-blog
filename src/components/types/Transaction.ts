export interface Transaction {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE" | string;
  amount: number;
  amountInCents?: boolean;
  currency: string;
  category: string;
  note: string;
  createdAt: Date | null;
}

export type FilterType = "today" | "weekly" | "monthly" | "custom";