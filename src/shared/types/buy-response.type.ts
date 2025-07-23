export type BuyResponse = {
  totalSpent: number;
  items: {
    id: number;
    productName: string;
    quantityBought: number;
  }[];
  remainingDeposit: number;
};
