module.exports = {
  // Syntax/Parsing Errors
  MISSING_KEYWORD: 'Missing required keyword',
  INVALID_KEYWORD_ORDER: 'Invalid keyword order',
  MALFORMED_INSTRUCTION: 'Malformed instruction: unable to parse keywords',

  // Amount Errors
  INVALID_AMOUNT: 'Amount must be a positive integer',

  // Account Errors
  ACCOUNT_NOT_FOUND: 'Account not found',
  SAME_ACCOUNT: 'Debit and credit accounts cannot be the same',
  INSUFFICIENT_FUNDS: 'Insufficient funds in debit account',
  INVALID_ACCOUNT_ID: 'Invalid account ID format',

  // Currency Errors
  CURRENCY_MISMATCH: 'Account currency mismatch',
  UNSUPPORTED_CURRENCY: 'Unsupported currency. Only NGN, USD, GBP, and GHS are supported',
  INSTRUCTION_CURRENCY_MISMATCH: 'Instruction currency does not match account currency',

  // Date Errors
  INVALID_DATE_FORMAT: 'Invalid date format',

  // Success Messages
  TRANSACTION_SUCCESSFUL: 'Transaction executed successfully',
  TRANSACTION_PENDING: 'Transaction scheduled for future execution',
};
