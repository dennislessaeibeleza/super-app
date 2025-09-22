/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */

function debug (...args) {
  console.log(JSON.stringify(args));
}

function validateLines(lines, planName) {
  return lines.filter(line => {
    const re = new RegExp(`${planName}`, 'gi');
    
    return re.test(line.appstleBBName?.value);
  }).length;
}

export function cartValidationsGenerateRun({ cart }) {
  try {
    const subscriptions = {
      '3 meses': {
        name: 'Hidratei subscription - 3 meses',
        min: 3,
        max: 3
      },
      '6 meses': {
        name: 'Hidratei subscription - 6 meses',
        min: 4,
        max: 6
      },
      '12 meses': {
        name: 'Hidratei subscription - 12 meses',
        min: 5,
        max: 8
      }
    };

    const operations = [];
    for(const subscription in subscriptions) {
      const subscriptionProductsCount = validateLines(cart.lines, subscription);
      
      if (subscriptionProductsCount > 0 && (subscriptionProductsCount < subscriptions[subscription].min || subscriptionProductsCount > subscriptions[subscription].max)) {
        operations.push({
          validationAdd: {
            errors: [
              {
                target: '$.checkout',
                message: `Sua assinatura de ${subscription} não possui a quantidade de produtos permitida.`
              }
            ]
          }
        });
      }
    }
    return {
      operations
    }
  } catch(err) {
    console.error(err);
  }
  
  return {
    operations: []
  };
};