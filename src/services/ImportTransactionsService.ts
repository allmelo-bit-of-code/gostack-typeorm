import path from 'path';
import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
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
    // Reading the CSV file

    const csvFilePath = path.join(uploadConfig.directory, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const originalData: CSVTransaction[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;
      if (!title || !type || !value) {
        throw new AppError('CSV Invalid, please reformat');
      }
      originalData.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // Dealing with new categories

    const everyCategoryOnImport = originalData.map(data => data.category);

    const categoriesToRegister = everyCategoryOnImport.filter(function (
      elem,
      index,
      self,
    ) {
      return index === self.indexOf(elem);
    });

    const categoriesRepository = getRepository(Category);

    const categoriesToIgnore = await categoriesRepository.find({
      where: { title: In(categoriesToRegister) },
    });

    for (let cat = 0; cat < categoriesToIgnore.length; cat += 1) {
      for (let i = 0; i < categoriesToRegister.length; i += 1) {
        if (categoriesToRegister[i] === categoriesToIgnore[cat].title) {
          categoriesToRegister.splice(i, 1);
          i -= 1;
        }
      }
    }

    const allCategories = [];

    if (categoriesToIgnore.length > 0) {
      for (let i = 0; i < categoriesToIgnore.length; i += 1) {
        allCategories.push(categoriesToIgnore[i]);
      }
    }

    if (categoriesToRegister.length > 0) {
      const newCategories = categoriesToRegister.map(title =>
        categoriesRepository.create({ title }),
      );

      const newRegisteredCategories = await categoriesRepository.save(
        newCategories,
      );

      for (let i = 0; i < newRegisteredCategories.length; i += 1) {
        allCategories.push(newRegisteredCategories[i]);
      }
    }

    // Dealing with new transactions

    const newTransactions: Transaction[] = [];
    const newTransaction = getRepository(Transaction);

    for (let i = 0; i < originalData.length; i += 1) {
      const categoryToMatch = originalData[i];

      const categoryReference = allCategories.find(
        category => category.title === categoryToMatch.category,
      );

      if (!categoryReference) {
        throw new AppError('Problem found on import');
      }

      const transaction = newTransaction.create({
        title: originalData[i].title,
        value: originalData[i].value,
        type: originalData[i].type,
        category_id: categoryReference.id,
      });

      newTransactions.push(transaction);
    }

    if (newTransactions.length !== originalData.length) {
      throw new AppError('Lost some transactions while processing import');
    }

    await newTransaction.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
