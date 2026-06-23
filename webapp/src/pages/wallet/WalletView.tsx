import { PageWrapper } from '../../shared/ui';
import { BalanceCard, TokenList } from './components';

export const WalletView = () => {
  return (
    <PageWrapper className="pb-4 -mx-2 md:mx-0 flex flex-col lg:grid lg:grid-cols-[350px_1fr] gap-3 lg:gap-8">
      <div className="shrink-0">
        <BalanceCard />
      </div>
      <div className="flex-1">
        <TokenList />
      </div>
    </PageWrapper>
  );
};
