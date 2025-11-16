const validator = require('@app-core/validator');
const PaymentMessages = require('@app/messages/payment');
const { parseInstruction } = require('./parse-instructions');
const validateTransaction = require('./validate-transactions');
const executeTransaction = require('./execute-transaction');

const paymentInstructionSpec = `root {
  accounts[] {
    id string
    balance number
    currency string
  }
  instruction string
}`;

const parsedPaymentInstructionSpec = validator.parse(paymentInstructionSpec);

function getStatusReason(errorCode) {
  const reasons = {
    SY01: PaymentMessages.MISSING_KEYWORD,
    SY02: PaymentMessages.INVALID_KEYWORD_ORDER,
    SY03: PaymentMessages.MALFORMED_INSTRUCTION,
    AM01: PaymentMessages.INVALID_AMOUNT,
    AC04: PaymentMessages.INVALID_ACCOUNT_ID,
    DT01: PaymentMessages.INVALID_DATE_FORMAT,
  };
  return reasons[errorCode] || PaymentMessages.MALFORMED_INSTRUCTION;
}

async function processPayment(serviceData) {
  // Step 1: Validate input structure
  const data = validator.validate(serviceData, parsedPaymentInstructionSpec);

  const { accounts, instruction } = data;

  // Step 2: Parse the instruction
  const parsed = parseInstruction(instruction);

  // Step 3: Check for parsing errors
  if (parsed.errors.length > 0) {
    // Return error response for unparseable instruction
    return {
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      debit_account: parsed.debit_account,
      credit_account: parsed.credit_account,
      execute_by: parsed.execute_by,
      status: 'failed',
      status_reason: getStatusReason(parsed.errors[0]),
      status_code: parsed.errors[0],
      accounts: [],
    };
  }

  // Step 4: Validate business rules
  const validation = validateTransaction(parsed, accounts);

  if (!validation.isValid) {
    // Return error response with accounts unchanged
    const errorAccounts = executeTransaction(parsed, accounts, false);

    return {
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      debit_account: parsed.debit_account,
      credit_account: parsed.credit_account,
      execute_by: parsed.execute_by,
      status: 'failed',
      status_reason: validation.statusReason,
      status_code: validation.statusCode,
      accounts: errorAccounts,
    };
  }

  // Step 5: Execute or mark as pending
  const shouldExecute = !validation.isPending;
  const updatedAccounts = executeTransaction(parsed, accounts, shouldExecute);

  return {
    type: parsed.type,
    amount: parsed.amount,
    currency: parsed.currency,
    debit_account: parsed.debit_account,
    credit_account: parsed.credit_account,
    execute_by: parsed.execute_by,
    status: validation.isPending ? 'pending' : 'successful',
    status_reason: validation.statusReason,
    status_code: validation.statusCode,
    accounts: updatedAccounts,
  };
}

module.exports = processPayment;
