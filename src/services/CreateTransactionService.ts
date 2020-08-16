// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute(transactionRequest: Request): Promise<Transaction> {
    const { title, value, type, category } = transactionRequest;

    const checkCategory = new TransactionsRepository();
    const registeredCategory = await checkCategory.matchCategory(category);

    const newTransaction = getRepository(Transaction);

    const transaction = newTransaction.create({
      title,
      value,
      type,
      category_id: registeredCategory.id,
    });

    await newTransaction.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
