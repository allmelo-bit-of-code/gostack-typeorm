// import AppError from '../errors/AppError';

import { getRepository } from 'typeorm';
import {} from 'uuid-v4';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Request {
  uuid: string;
}

class DeleteTransactionService {
  public async execute({ uuid }: Request): Promise<Transaction> {
    const findTransaction = getRepository(Transaction);

    try {
      const transaction = await findTransaction.findOneOrFail({
        where: { id: uuid },
      });

      await findTransaction.remove(transaction);

      return transaction;
    } catch {
      throw new AppError('Transaction ID not found on database');
    }
  }
}

export default DeleteTransactionService;
