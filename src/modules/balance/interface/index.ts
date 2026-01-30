export interface ITransaction {
    user_id: string
    amount: number
}

export interface ITransactionRequest {
    transactions: ITransaction[]
    checkBalance: boolean
}
