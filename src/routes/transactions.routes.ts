import { Router } from 'express';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

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

transactionsRouter.post('/import', async (request, response) => {
  // TODO
});

export default transactionsRouter;
