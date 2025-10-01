/**
 * ESSA EXTENSÃO É PARA TESTAR UMA SOLICITAÇÃO FEITA POR 'RICARDO' EM BB, DO TIPO
 * COMPRE 'X' E GANHA 'Y'
 * 
 * O APP DEVE FUNCIONAR DA SEGUINTE FORMA:
 * 
 * 1. O CLIENTE ADICIONA UM PRODUTO [X]( ALVO );
 * 2. A PARTIR DISSO 50% DE DESCONTO É APLICADO A TODOS OS OUTROS PRODUTOS;
 * 
 * Example of entry on Shop metafield:
 *  {
      "title": "50% OFF",
      "discount": 50,
      "minimalValue": 230,
      "products": [
        "9031571931287"
      ]
    }
 */

import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

function debug(...anything) {
  return console.log(JSON.stringify(anything));
}

function hasTriggersProducts(cartLines, triggersProducts) {
  return triggersProducts.some(productId => {
    return cartLines.some(line => line.merchandise.product.id === `gid://shopify/Product/${productId}`);
  });
}

function getCheapestItem(cartLines, excludeIds = []) {
  const nonZeroLines = cartLines.filter(line => (line.cost.subtotalAmount.amount > 0));
  const targetItems = nonZeroLines.filter(line => !excludeIds.some(id => line.merchandise.product.id === `gid://shopify/Product/${id}`));

  if (nonZeroLines.length === 0) {
    return null;
  }

  const cheapestItem = targetItems.reduce((cheapestItem, line) => {
      const cheapestItemPrice = (cheapestItem.cost.subtotalAmount.amount / cheapestItem.quantity);
      const linePrice = (line.cost.subtotalAmount.amount / line.quantity);
      
      if (linePrice < cheapestItemPrice) {
        cheapestItem = line;
      }

      return cheapestItem;
    }, cartLines[0]);
    
  return {
    cartLine: {
      id: cheapestItem.id,
      quantity: cheapestItem.quantity
    }
  };
}

export function cartLinesDiscountsGenerateRun({ cart, shop, discount}) {
  const operations = [];

  try {
    const discountCheapestItem = shop.discountCheapestItem.jsonValue;
    const discountValue = Math.min(Math.max(0, discountCheapestItem.discount), 100) || 0;
    const discountTitle = discountCheapestItem.title;
    const minimalValue = discountCheapestItem.minimalValue || 0;
    const triggersProducts = discountCheapestItem.products;
    const totalPrice = cart.cost.totalAmount.amount;
    const cheapestItem = getCheapestItem(cart.lines, triggersProducts);

    if (!cart.lines.length) {
      throw new Error('No cart lines found');
    }

    const hasProductDiscountClass = discount.discountClasses.includes(
      DiscountClass.Product,
    );

    if (!hasProductDiscountClass) {
      return {operations: []};
    }

    if (!hasTriggersProducts(cart.lines, triggersProducts)) {
      return {operations: []};
    }

    if (totalPrice < minimalValue) {
      return {operations: []};
    }

    if (cheapestItem === null) {
      return {operations: []};
    }

    operations.push({
      productDiscountsAdd: {
        candidates: [
          {
            message: discountTitle,
            targets: [cheapestItem],
            value: {
              percentage: {
                value: discountValue,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.All,
      },
    });
  } catch(err) {
    console.error(err);
  }

  return {
    operations,
  };
}