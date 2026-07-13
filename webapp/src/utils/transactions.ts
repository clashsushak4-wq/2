import { mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4, internal, external, beginCell, storeMessage } from '@ton/ton';
import axios from 'axios';

const BASE_URL = 'https://tonapi.io/v2';

/**
 * Отправляет транзакцию в сеть The Open Network (TON).
 */
export async function sendTransaction(
  mnemonicStr: string,
  toAddress: string,
  amount: string,
  currency: 'GRAM' | 'USDT'
) {
  const mnemonicArray = mnemonicStr.split(' ');
  const keyPair = await mnemonicToWalletKey(mnemonicArray);
  const workchain = 0;
  const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

  // 1. Получаем seqno из TonAPI
  const seqnoRes = await axios.get(`${BASE_URL}/wallet/${wallet.address.toString({bounceable: false})}/seqno`);
  const seqno = seqnoRes.data.seqno;

  let messageBody;

  if (currency === 'GRAM') {
    // Простой перевод GRAM
    messageBody = internal({
      to: toAddress,
      value: amount, // в GRAM (например "0.5")
      bounce: false,
      body: 'Transfer from Trading Bot Wallet'
    });
  } else {
    // Перевод USDT (Jetton)
    const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    
    // 1. Узнаем адрес Jetton-кошелька отправителя
    const jettonWalletRes = await axios.get(`${BASE_URL}/accounts/${wallet.address.toString({bounceable: false})}/jettons/${USDT_MASTER}`);
    const senderJettonWallet = jettonWalletRes.data.wallet_address.address;

    // Импортируем Address для парсинга
    const { Address } = await import('@ton/ton');
    const destinationAddress = Address.parse(toAddress);

    // 2. Формируем payload для Jetton Transfer (USDT имеет 6 знаков после запятой)
    const jettonAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
    const forwardPayload = beginCell().storeUint(0, 32).storeStringTail('Transfer from Bot').endCell();

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32) // opcode for jetton transfer
      .storeUint(0, 64) // query id
      .storeCoins(jettonAmount) // amount
      .storeAddress(destinationAddress) // куда отправляем
      .storeAddress(wallet.address) // куда вернуть остаток газа
      .storeBit(0) // no custom payload
      .storeCoins(1n) // forward amount (nanoTON)
      .storeBit(1) // we store forward payload as reference
      .storeRef(forwardPayload)
      .endCell();

    // 3. Упаковываем это во внутреннее сообщение к нашему Jetton-кошельку
    messageBody = internal({
      to: senderJettonWallet,
      value: '0.05', // 0.05 GRAM на оплату газа для смарт-контракта жетона
      bounce: true,
      body: body
    });
  }

  // 3. Создаем трансфер
  const transfer = wallet.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [messageBody]
  });

  // 4. Компилируем external message
  const extMessage = external({
    to: wallet.address,
    init: seqno === 0 ? wallet.init : undefined,
    body: transfer
  });

  // Правильная сериализация сообщения в BOC
  const extCell = beginCell().store(storeMessage(extMessage)).endCell();
  const boc = extCell.toBoc().toString('base64');

  // 5. Отправляем BOC в сеть
  const sendRes = await axios.post(`${BASE_URL}/messages`, {
    boc
  });

  return sendRes.data;
}
