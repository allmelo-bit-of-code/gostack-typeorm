import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
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

    const checkRequestedTransaction = new TransactionsRepository();
    const newTransaction = getRepository(Transaction);

    if (type === 'outcome') {
      const checkBalance = await checkRequestedTransaction.getBalance();
      if (checkBalance.total > value) {
        const registeredCategory = await checkRequestedTransaction.matchCategory(
          category,
        );

        const transaction = newTransaction.create({
          title,
          value,
          type,
          category_id: registeredCategory.id,
        });

        const registeredTransaction = await newTransaction.save(transaction);

        return registeredTransaction;
      }
      throw new AppError('You need to add more funds in your wallet');
    }

    if (type === 'income') {
      const registeredCategory = await checkRequestedTransaction.matchCategory(
        category,
      );

      const transaction = newTransaction.create({
        title,
        value,
        type,
        category_id: registeredCategory.id,
      });

      const registeredTransaction = await newTransaction.save(transaction);

      return registeredTransaction;
    }

    throw new AppError('Type of transaction not recognizable');
  }
}

export default CreateTransactionService;
