import path from 'path';
import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/uploads';
import AppError from '../errors/AppError';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const originalData: CSVTransaction[] = [];
    const processedData: Transaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, rawCategory] = line;
      if (!title || !type || !value) {
        throw new AppError('CSV Invalid, please reformat');
      }
      const category = rawCategory.toLowerCase();

      originalData.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const checkRequestedTransaction = new TransactionsRepository();
    const newTransaction = getRepository(Transaction);

    const allTransactions = originalData.map(async transaction => {
      if (transaction.type === 'outcome') {
        const checkBalance = await checkRequestedTransaction.getBalance();
        if (checkBalance.total > transaction.value) {
          const registeredCategory = await checkRequestedTransaction.matchCategory(
            transaction.category,
          );

          const registeredTransaction = newTransaction.create({
            title: transaction.title,
            value: transaction.value,
            type: transaction.type,
            category_id: registeredCategory.id,
          });

          await newTransaction.save(registeredTransaction);

          return registeredTransaction;
        }
        throw new AppError('You need to add more funds in your wallet');
      }

      if (transaction.type === 'income') {
        const registeredCategory = await checkRequestedTransaction.matchCategory(
          transaction.category,
        );

        const registeredTransaction = newTransaction.create({
          title: transaction.title,
          value: transaction.value,
          type: transaction.type,
          category_id: registeredCategory.id,
        });

        await newTransaction.save(registeredTransaction);

        return registeredTransaction;
      }
    });
    return allTransactions;
  }
}

export default ImportTransactionsService;
