import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async all(): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find();

    return transactions;
  }

  private async calculateBalanceFor(type: string): Promise<number> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find({
      where: { type },
    });

    if (transactions.length === 0) {
      return 0;
    }

    const valuesToSum = transactions.map(transaction => transaction.value);
    const sum = valuesToSum.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
    );
    return sum;
  }

  public async getBalance(): Promise<Balance> {
    const totalIncome = await this.calculateBalanceFor('income');
    const totalOutcome = await this.calculateBalanceFor('outcome');

    const balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total: totalIncome - totalOutcome,
    };

    return balance;
  }

  public async matchCategory(title: string): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const findCategory = await categoriesRepository.findOne({
      where: { title },
    });

    if (!findCategory) {
      const newCategory = categoriesRepository.create({
        title,
      });
      categoriesRepository.save(newCategory);
      return newCategory;
    }

    return findCategory;
  }
}

export default TransactionsRepository;
