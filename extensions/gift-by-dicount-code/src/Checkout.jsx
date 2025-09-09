import {
  reactExtension,
  Banner,
  useSettings,
  useDiscountCodes,
  useCartLines,
  useApplyCartLinesChange,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function debounce(func, timeout = 500){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

const debouncedRun = debounce((fn) => fn());

function Extension() {
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();
  const discountsCodes = useDiscountCodes();
  const settings = Object.assign({
    discount_code: 'FREESHIPPING',
    variant_id: 'gid://shopify/ProductVariant/45516846203031'
  }, useSettings());
  const [response, setResponse] = useState(null);

  function addVariant(id = null, quantity = 1) {
    if (!id) return;

    applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: id,
      quantity: quantity
    });
  }

  function removeItem(item = null) {
    if (!item) return;

    applyCartLinesChange({
      type: 'removeCartLine',
      id: item.id,
      quantity: item.quantity
    });
  }
  
  /* START: Debounced method */
  debouncedRun(function(){
    const discountCodeExists = discountCodeIsUsed(settings.discount_code, discountsCodes);
    const giftCartLine = getCartLineByVariantId(settings.variant_id, cartLines);
    const successMessage = <Banner status="success" title="O brinde foi adicionado"></Banner>

    if (!discountCodeExists && giftCartLine) {
      removeItem(giftCartLine);

      return null;
    }

    if (discountCodeExists && !giftCartLine) {
      addVariant(settings.variant_id);

      return null;
    }

    setResponse(giftCartLine ? successMessage: null);
  });
  /* END: Debounced method */
  
  return response;
}

function discountCodeIsUsed(discountCode, discountsCodesList) {
  return discountsCodesList.some(({code}) => code === discountCode);
}

function getCartLineByVariantId(variantId, cartLines) {
  return cartLines.find(line => line.merchandise.id === variantId);
}