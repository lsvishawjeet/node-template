// parse function for payment instructions
// split the string and push it to array
function splitInstruction(instruction) {
  const result = [];
  let token = '';
  let i = 0;
  const n = instruction.length;

  while (i < n) {
    // Skip all whitespace
    while (i < n && instruction[i].trim() === '') i++;

    // Build token
    while (i < n && instruction[i].trim() !== '') {
      token += instruction[i];
      i++;
    }

    if (token) {
      result.push(token);
      token = '';
    }
  }
  return result;
}

// validate the account id format
function isAccountIdValid(accountId) {
  if (!accountId || accountId.length === 0) {
    return false;
  }

  for (let i = 0; i < accountId.length; i++) {
    const char = accountId[i];
    const isLetter = (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z');
    const isDigit = char >= '0' && char <= '9';
    const isHyphen = char === '-';
    const isPeriod = char === '.';
    const isAtSymbol = char === '@';

    if (!(isLetter || isDigit || isHyphen || isPeriod || isAtSymbol)) {
      return false;
    }
  }
  return true;
}

function isDateFormatValid(dateStr) {
  if (!dateStr || dateStr.length !== 10) {
    return false;
  }

  // check YYYY-MM-DD format
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);

  if (dateStr[4] !== '-' || dateStr[7] !== '-') {
    return false;
  }

  // check if all the char in date are digits
  for (let i = 0; i < dateStr.length; i++) {
    if (i !== 4 && i !== 7) {
      // skip hyphens
      if (dateStr[i] < '0' || dateStr[i] > '9') {
        return false;
      }
    }
  }

  const dateYear = parseInt(year, 10);
  const dateMonth = parseInt(month, 10);
  const dateDay = parseInt(day, 10);

  if (dateMonth < 1 || dateMonth > 12) {
    return false;
  }

  if (dateDay < 1 || dateDay > 31) {
    return false;
  }

  if (dateYear < 1000 || dateYear > 9999) {
    return false;
  }

  return true;
}

function compareDateWithCurrent(dateStr) {
  // provided date in UTC
  const providedDate = new Date(`${dateStr}T00:00:00Z`);

  // current date in UTC
  const currenDate = new Date();
  const currentUTCDate = new Date(
    Date.UTC(
      currenDate.getUTCFullYear(),
      currenDate.getUTCMonth(),
      currenDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  // this condition will mark payment as pending (AP02)
  if (providedDate > currentUTCDate) {
    return 'FUTURE';
  }

  // this condition will execute payment immediately (AP00)
  return 'PAST_OR_TODAY';
}

function parseInstruction(instruction) {
  const result = {
    type: null,
    amount: null,
    currency: null,
    debit_account: null,
    credit_account: null,
    execute_by: null,
    errors: [],
  };

  const normalizedInstruction = instruction.trim().toUpperCase();
  const originalInstruction = instruction.trim();

  if (normalizedInstruction.length === 0) {
    result.errors.push('SY03');
    return result;
  }

  // Determine type
  const isDebit = normalizedInstruction.indexOf('DEBIT') === 0;
  const isCredit = normalizedInstruction.indexOf('CREDIT') === 0;

  if (!isDebit && !isCredit) {
    result.errors.push('SY01');
    return result;
  }

  result.type = isDebit ? 'DEBIT' : 'CREDIT';

  // Keyword positions
  const fromAccountIndex = normalizedInstruction.indexOf('FROM ACCOUNT');
  const toAccountIndex = normalizedInstruction.indexOf('TO ACCOUNT');
  const forKeywordIndex = normalizedInstruction.indexOf('FOR');
  const onDateIndex = normalizedInstruction.indexOf('ON');

  if (fromAccountIndex === -1 || toAccountIndex === -1 || forKeywordIndex === -1) {
    result.errors.push('SY01');
    return result;
  }

  // DEBIT
  if (isDebit) {
    if (fromAccountIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    if (toAccountIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    if (forKeywordIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    // Order check: DEBIT < FROM < FOR < TO
    if (
      !(
        fromAccountIndex > 5 &&
        forKeywordIndex > fromAccountIndex &&
        toAccountIndex > forKeywordIndex
      )
    ) {
      result.errors.push('SY02');
      return result;
    }

    // Extract amount and currency
    const amountCurrencyPart = normalizedInstruction.substring(5, fromAccountIndex).trim();
    const amountCurrencyTokens = splitInstruction(amountCurrencyPart);

    if (amountCurrencyTokens.length < 2) {
      result.errors.push('SY03');
      return result;
    }

    const amountStr = amountCurrencyTokens[0];
    const currencyStr = amountCurrencyTokens[1];

    const amount = parseInt(amountStr, 10);
    if (
      Number.isNaN(amount) ||
      amount <= 0 ||
      amountStr.includes('.') ||
      amountStr.startsWith('-')
    ) {
      result.errors.push('AM01');
      return result;
    }

    result.amount = amount;
    result.currency = currencyStr;

    // Extract debit account (FROM -> FOR)
    const debitAccountPart = originalInstruction
      .substring(fromAccountIndex + 13, forKeywordIndex)
      .trim();
    if (!isAccountIdValid(debitAccountPart)) {
      result.errors.push('AC04');
      return result;
    }
    result.debit_account = debitAccountPart;

    // Extract credit account (TO -> ON or end)
    const creditAccountEnd = onDateIndex !== -1 ? onDateIndex : originalInstruction.length;
    const creditAccountPart = originalInstruction
      .substring(toAccountIndex + 11, creditAccountEnd)
      .trim();

    if (!isAccountIdValid(creditAccountPart)) {
      result.errors.push('AC04');
      return result;
    }

    result.credit_account = creditAccountPart;
  }

  // CREDIT
  if (isCredit) {
    if (toAccountIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    if (fromAccountIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    if (forKeywordIndex === -1) {
      result.errors.push('SY01');
      return result;
    }

    // Order check: CREDIT < TO < FOR < FROM
    if (
      !(
        toAccountIndex > 6 &&
        forKeywordIndex > toAccountIndex &&
        fromAccountIndex > forKeywordIndex
      )
    ) {
      result.errors.push('SY02');
      return result;
    }

    // Extract amount and currency
    const amountCurrencyPart = normalizedInstruction.substring(6, toAccountIndex).trim();
    const amountCurrencyTokens = splitInstruction(amountCurrencyPart);

    if (amountCurrencyTokens.length < 2) {
      result.errors.push('SY03');
      return result;
    }

    const amountStr = amountCurrencyTokens[0];
    const currencyStr = amountCurrencyTokens[1];

    const amount = parseInt(amountStr, 10);
    if (
      Number.isNaN(amount) ||
      amount <= 0 ||
      amountStr.includes('.') ||
      amountStr.startsWith('-')
    ) {
      result.errors.push('AM01');
      return result;
    }

    result.amount = amount;
    result.currency = currencyStr;

    // credit account (TO -> FOR)
    const creditAccountPart = originalInstruction
      .substring(toAccountIndex + 11, forKeywordIndex)
      .trim();
    if (!isAccountIdValid(creditAccountPart)) {
      result.errors.push('AC04');
      return result;
    }
    result.credit_account = creditAccountPart;

    // debit account (FROM -> ON or end)
    const debitAccountEnd = onDateIndex !== -1 ? onDateIndex : originalInstruction.length;
    const debitAccountPart = originalInstruction
      .substring(fromAccountIndex + 13, debitAccountEnd)
      .trim();

    if (!isAccountIdValid(debitAccountPart)) {
      result.errors.push('AC04');
      return result;
    }

    result.debit_account = debitAccountPart;
  }

  // Extract ON date if present
  if (onDateIndex !== -1) {
    const datePart = originalInstruction.substring(onDateIndex + 3).trim();
    if (!isDateFormatValid(datePart)) {
      result.errors.push('DT01');
      return result;
    }
    result.execute_by = datePart;
  }

  return result;
}

module.exports = { parseInstruction, compareDateWithCurrent };
