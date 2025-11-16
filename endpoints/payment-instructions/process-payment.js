const { createHandler } = require('@app-core/server');
const processPayment = require('@app/services/payment-processors/process-payment');

module.exports = createHandler({
  path: '/payment-instructions',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = rc.body;

    try {
      const response = await processPayment(payload);

      const httpStatus =
        response.status === 'failed'
          ? helpers.http_statuses.HTTP_400_BAD_REQUEST
          : helpers.http_statuses.HTTP_200_OK;

      return {
        status: httpStatus,
        data: response,
      };
    } catch (error) {
      return {
        status: helpers.http_statuses.HTTP_400_BAD_REQUEST,
        data: {
          type: null,
          amount: null,
          currency: null,
          debit_account: null,
          credit_account: null,
          execute_by: null,
          status: 'failed',
          status_reason: error.message || 'Invalid request format',
          status_code: 'SY03',
          accounts: [],
        },
      };
    }
  },
});
