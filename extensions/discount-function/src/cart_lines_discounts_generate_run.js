/**
 * ESSA EXTENSÃO É PARA TESTAR UMA SOLICITAÇÃO FEITA POR 'RICARDO' EM BB, DO TIPO
 * COMPRE 'X' E GANHA 'Y'
 * 
 * O APP DEVE FUNCIONAR DA SEGUINTE FORMA:
 * 
 * 1. O CLIENTE ADICIONA UM PRODUTO [X]( ALVO );
 * 2. A PARTIR DISSO 50% DE DESCONTO É APLICADO A TODOS OS OUTROS PRODUTOS;
 * 
 */

import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

function debug(anything) {
  return console.log(JSON.stringify(anything));
}

function hasProduct(offerProductsByIds, cartItems) {
  return offerProductsByIds.some(productId => {
    return cartItems.some(item => item.merchandise.product.id === productId)
  });
}

function getItemsByProductId(cartItems, offerProducts, limit) {
  const offerTriggerProductId = offerProducts.buy[0];

  return offerProducts.get.reduce((result, productId) => {
    const line = cartItems.find(line => {
      return line.merchandise.product.id === productId;
    });

    if (line && limit > 0) {
      let quantity = line.merchandise.product.id === offerTriggerProductId ? (line.quantity - 1): line.quantity;
      
      if (quantity > 0) {
        limit--;

        result.push({
          cartLine: {
            id: line.id,
            quantity: quantity
          }
        });
      }
    }
    
    return result;
  }, []);
}

export function cartLinesDiscountsGenerateRun(input) {
  const operations = [];

  try {
    const buyXGetY = input.shop.buyXGetY.jsonValue;
    const discountValue = Math.min(Math.max(0, buyXGetY.discount), 100) || 0;
    const discountTitle = buyXGetY.title;
    const offerLimit = buyXGetY.maxProducts || 3;
    const offerProducts = {
      buy: buyXGetY.buy.map(id => `gid://shopify/Product/${id}`),
      get: buyXGetY.get.map(id => `gid://shopify/Product/${id}`)
    };

    if (!input.cart.lines.length) {
      throw new Error('No cart lines found');
    }

    const hasProductDiscountClass = input.discount.discountClasses.includes(
      DiscountClass.Product,
    );

    if (!hasProductDiscountClass) {
      return {operations: []};
    }
    
    if (hasProductDiscountClass && hasProduct(offerProducts.buy, input.cart.lines)) {
      operations.push({
        productDiscountsAdd: {
          candidates: [
            {
              message: discountTitle,
              targets: getItemsByProductId(input.cart.lines, offerProducts, offerLimit),
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
    }
  } catch(err) {
    console.error(err);
  }

  return {
    operations,
  };
}