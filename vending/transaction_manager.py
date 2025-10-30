from decimal import Decimal
from vending.product import Product
class TransactionManager:
   
    def __init__(self):
        self.current_balance = Decimal("0.00")


    def feed_money(self, amount: Decimal = Decimal("1.00")) -> Decimal:

        if amount <= 0:
            raise ValueError("Amount must be positive.")
        self.current_balance += Decimal(amount)
        return self.current_balance

    def get_balance(self) -> Decimal:
        return self.current_balance

    def reset_balance(self):
        self.current_balance = Decimal("0.00")

    def purchase(self, product: Product) -> bool:

        price = product.price
        if price > self.current_balance:
            print("⚠️  Insufficient funds! Please add more money.")
            return False

        self.current_balance -= price
        return True

    def get_change(self) -> dict:

        change = self.current_balance
        total_pennies = int(change * 100)

        quarters = total_pennies // 25
        total_pennies %= 25
        dimes = total_pennies // 10
        total_pennies %= 10
        nickels = total_pennies // 5
        
        self.reset_balance()

        return {
            "quarters": quarters,
            "dimes": dimes,
            "nickels": nickels,
            "change_total": change
        }

    def __str__(self):
        return f"Current Balance: ${self.current_balance:.2f}"