from decimal import Decimal
from abc import ABC, abstractmethod

class Product(ABC):

    def __init__(self, name: str, price: Decimal):
        self._name = name
        self._price = Decimal(price)
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def price(self) -> Decimal:
        return self._price
    
    @abstractmethod
    def dispense_sound(self) -> str:
        pass

    def __str__(self):
        return f"{self._name} - ${self._price: .2f}"

