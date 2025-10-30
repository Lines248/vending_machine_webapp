from __future__ import annotations

from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, Optional

from vending.slot import Slot
from vending.product import Product
from vending.chips import Chips
from vending.candy import Candy
from vending.gum import Gum
from vending.beverage import Beverage


class FileManager:

    DEFAULT_INPUT = "vendingmachine.csv"
    DEFAULT_LOG   = "logs/transactions.log"
    SLOT_START_QUANTITY = 5

    def __init__(
        self,
        input_path: Optional[Path] = None,
        log_path: Optional[Path] = None,
    ) -> None:
        root = Path(__file__).resolve().parents[1]  
        self.input_path = Path(input_path) if input_path else (root / self.DEFAULT_INPUT)
        self.log_path   = Path(log_path) if log_path else (root / self.DEFAULT_LOG)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

        self._product_factories = {
            "CHIP":     Chips,
            "CANDY":    Candy,
            "GUM":      Gum,
            "DRINK":    Beverage,
            "BEVERAGE": Beverage,  
        }


    def read_inventory(self) -> Dict[str, Slot]:
   
        slots: Dict[str, Slot] = {}

        if not self.input_path.exists():
            self._warn(f"Inventory file not found at: {self.input_path}")
            return slots

        with self.input_path.open("r", encoding="utf-8") as fh:
            for i, raw in enumerate(fh, start=1):
                line = raw.strip()
                if not line:
                    continue  

                parts = [p.strip() for p in line.split("|")]
                if len(parts) != 4:
                    self._warn(f"Line {i}: expected 4 fields, got {len(parts)} → {line!r}")
                    continue

                slot_id, name, price_str, type_str = parts

                try:
                    price = Decimal(price_str)
                except (InvalidOperation, ValueError):
                    self._warn(f"Line {i}: invalid price {price_str!r}")
                    continue

                factory = self._product_factories.get(type_str.upper())
                if factory is None:
                    self._warn(f"Line {i}: unknown product type {type_str!r}")
                    continue

                slot = Slot(slot_id)
                product: Product = factory(name, price)
                for _ in range(self.SLOT_START_QUANTITY):
                    slot.add_product(product)
                slots[slot_id] = slot

        return slots

    def write_to_log(self, message: str = "Event") -> None:
  
        try:
            with self.log_path.open("a", encoding="utf-8") as log:
                from datetime import datetime
                ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log.write(f"[{ts}] {message}\n")
        except OSError as e:
            self._warn(f"Unable to write log: {e}")

    def _warn(self, msg: str) -> None:
        print(f"[FileManager] {msg}")