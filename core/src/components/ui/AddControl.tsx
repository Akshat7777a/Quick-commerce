import { Minus, Plus } from "lucide-react";
import { useCart } from "../../lib/cart";
import { useToast } from "../../lib/toast";
import type { Product } from "../../lib/types";

/**
 * The primary add-to-cart control: an outlined ADD button that becomes a
 * quantity stepper in place. Minus at 1 removes the line. The cart logic is
 * the existing one, untouched.
 */
export function AddControl({ product }: { product: Product }) {
  const { add, quantityOf, setQuantity, remove } = useCart();
  const { toast } = useToast();
  const quantity = quantityOf(product.id);

  if (product.stock <= 0) {
    return (
      <button type="button" className="ui-add" disabled aria-label={`${product.name} is out of stock`}>
        Out of stock
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        className="ui-add"
        aria-label={`Add ${product.name} to cart`}
        onClick={() => {
          add(product, 1);
          toast("Added to cart");
        }}
      >
        ADD
      </button>
    );
  }

  const atMax = quantity >= product.stock;

  return (
    <div className="ui-step" role="group" aria-label={`Quantity of ${product.name}`}>
      <button
        type="button"
        aria-label={quantity === 1 ? `Remove ${product.name} from cart` : `Reduce ${product.name} quantity`}
        onClick={() => {
          if (quantity === 1) {
            remove(product.id);
            toast("Removed from cart");
            return;
          }
          setQuantity(product.id, quantity - 1);
        }}
      >
        <Minus className="size-3.5" />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label={`Increase ${product.name} quantity`}
        disabled={atMax}
        onClick={() => {
          setQuantity(product.id, quantity + 1);
          if (quantity + 1 >= product.stock) {
            toast("That is the last of today's stock");
          }
        }}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
