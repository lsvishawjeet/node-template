// validate transaction function

const PaymentMessages = require('@app/messages/payment');
const { compareDateWithCurrent } = require('./parse-instructions');

function validateTransaction(parsed, accounts) {
  const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'GHS'];

  // check if currency is supported
  if (!SUPPORTED_CURRENCIES.includes(parsed.currency)) {
    return {
      isValid: false,
      statusCode: 'CU02',
      statusReason: PaymentMessages.UNSUPPORTED_CURRENCY,
    };
  }

  // find the accounts
  const debitAccount = accounts.find((acc) => acc.id === parsed.debit_account);
  const creditAccount = accounts.find((acc) => acc.id === parsed.credit_account);

  // check if debit account exists (AC03)
  if (!debitAccount) {
    return {
      isValid: false,
      statusCode: 'AC03',
      statusReason: `${PaymentMessages.ACCOUNT_NOT_FOUND}: ${parsed.debit_account}`,
    };
  }

  // check if credit account exists (AC03)
  if (!creditAccount) {
    return {
      isValid: false,
      statusCode: 'AC03',
      statusReason: `${PaymentMessages.ACCOUNT_NOT_FOUND}: ${parsed.credit_account}`,
    };
  }

  // check both accounts are not same
  if (parsed.debit_account === parsed.credit_account) {
    return {
      isValid: false,
      statusCode: 'AC02',
      statusReason: PaymentMessages.SAME_ACCOUNT,
    };
  }

  // check the account currencies match (CU01)
  if (debitAccount.currency !== creditAccount.currency) {
    return {
      isValid: false,
      statusCode: 'CU01',
      statusReason: PaymentMessages.CURRENCY_MISMATCH,
    };
  }

  // Check if instruction currency matches account currencies
  if (parsed.currency !== debitAccount.currency.toUpperCase()) {
    return {
      isValid: false,
      statusCode: 'CU01',
      statusReason: PaymentMessages.INSTRUCTION_CURRENCY_MISMATCH,
    };
  }

  // check for sufficient funds (AC01)
  if (debitAccount.balance < parsed.amount) {
    return {
      isValid: false,
      statusCode: 'AC01',
      statusReason: `${PaymentMessages.INSUFFICIENT_FUNDS}: ${parsed.debit_account}`,
    };
  }

  // transaction should be pending or executed
  if (parsed.execute_by) {
    const dateComparison = compareDateWithCurrent(parsed.execute_by);
    if (dateComparison === 'FUTURE') {
      return {
        isValid: true,
        statusCode: 'AP02',
        statusReason: PaymentMessages.TRANSACTION_PENDING,
        isPending: true,
      };
    }
  }

  // all validations passed, execute immediately
  return {
    isValid: true,
    statusCode: 'AP00',
    statusReason: PaymentMessages.TRANSACTION_SUCCESSFUL,
    isPending: false,
  };
}

module.exports = validateTransaction;
