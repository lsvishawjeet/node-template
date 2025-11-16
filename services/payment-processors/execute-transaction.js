// execute transaction function

function executeTransaction(parsed, accounts, shouldExecute) {
  const result = [];

  // Process all accounts, but only include the two involved in transaction
  accounts.forEach((account) => {
    if (account.id === parsed.debit_account) {
      const accountCopy = {
        id: account.id,
        balance: shouldExecute ? account.balance - parsed.amount : account.balance,
        balance_before: account.balance,
        currency: account.currency,
      };
      result.push(accountCopy);
    } else if (account.id === parsed.credit_account) {
      const accountCopy = {
        id: account.id,
        balance: shouldExecute ? account.balance + parsed.amount : account.balance,
        balance_before: account.balance,
        currency: account.currency,
      };
      result.push(accountCopy);
    }
  });

  return result;
}

module.exports = executeTransaction;
