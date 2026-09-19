import { MarginSettings } from './MarginSettings';
import { SideToggle } from './SideToggle';
import { OrderTypeSelect } from './OrderTypeSelect';
import { PriceInput } from './PriceInput';
import { AmountSlider } from './AmountSlider';
import { TPSLSettings } from './TPSLSettings';
import { BalanceInfo } from './BalanceInfo';
import { ActionButtons } from './ActionButtons';
import { useCryptoStore } from '../store/useCryptoStore';

export const OrderPanel = () => {
  return (
    <div className="flex flex-col flex-[1.4] pr-1 select-none">
      <MarginSettings />
      <SideToggle />
      <OrderTypeSelect />
      <PriceInput />
      <AmountSlider />
      <TPSLVisibility />
      <BalanceInfo />
      <ActionButtons />
    </div>
  );
};

const TPSLVisibility = () => {
  const orderIntent = useCryptoStore(state => state.orderIntent);
  return orderIntent === 'open' ? <TPSLSettings /> : null;
};
