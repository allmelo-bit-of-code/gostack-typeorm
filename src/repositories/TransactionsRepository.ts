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
  public async getBalance(): Promise<Balance> {
    // TODO
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
