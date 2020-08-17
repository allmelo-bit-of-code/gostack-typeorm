import { Router } from 'express';
import multer from 'multer';
import Transaction from '../models/Transaction';

import uploadConfig from '../config/uploads';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import AppError from '../errors/AppError';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = new TransactionsRepository();

  const transactions = await transactionsRepository.all();
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const verifyCategory = category.toLowerCase();

  const newTransaction = new CreateTransactionService();

  const createdTransaction = await newTransaction.execute({
    title,
    value,
    type,
    category: verifyCategory,
  });

  return response.json(createdTransaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const uuid = request.params.id;

  const deleteTransaction = new DeleteTransactionService();

  const deletedTransaction = await deleteTransaction.execute({ uuid });

  return response.json(deletedTransaction);
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    if (request.file.mimetype === 'text/csv') {
      const importTransactionsService = new ImportTransactionsService();
      const importedTransactions = await importTransactionsService.execute(
        request.file.filename,
      );
      return response.json(importedTransactions);
    }
    throw new AppError('Incorrect extension. Only CSV files are allowed');
  },
);

export default transactionsRouter;
