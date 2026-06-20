import { BottomNav } from "./BottomNav";
import { BagDrawer } from "./bag/BagDrawer";
import { StoreFooter } from "./StoreFooter";
import { StoreHeader } from "./StoreHeader";
import { StoreWarehouseStrip } from "./StoreWarehouseStrip";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-app">
      <StoreHeader />
      <main className="store-main">{children}</main>
      <StoreFooter />
      <StoreWarehouseStrip />
      <BagDrawer />
      <BottomNav />
    </div>
  );
}
