import { MarginSettings } from './MarginSettings';
import { SideToggle } from './SideToggle';
import { OrderTypeSelect } from './OrderTypeSelect';
import { PriceInput } from './PriceInput';
import { AmountSlider } from './AmountSlider';
import { TPSLSettings } from './TPSLSettings';
import { ActionButtons } from './ActionButtons';

export const OrderPanel = () => {
  return (
    <div className="flex flex-col flex-[1.7] pr-1 border-r border-zinc-900/50 select-none">
      <MarginSettings />
      <SideToggle />
      <OrderTypeSelect />
      <PriceInput />
      <AmountSlider />
      <TPSLSettings />
      <ActionButtons />
    </div>
  );
};
