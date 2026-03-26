import { toast, updateToast } from './toast';
import { explorerTx } from './utils';

// RFQ toast messages
export function toastRFQSubmitting(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the transaction in your wallet.', status: 'loading', duration: null });
}

export function toastRFQCreated(id: number, quotationId: string, txHash?: string): void {
  updateToast(id, {
    title: `RFQ created (#${quotationId})`,
    description: txHash ? `tx: ${txHash.slice(0, 10)}...` : undefined,
    status: 'success',
    duration: 15000,
  });
}

// Close RFQ toast messages
export function toastCloseSubmitting(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the close RFQ in your wallet.', status: 'loading', duration: null });
}

export function toastCloseCreated(id: number, quotationId: string, txHash?: string): void {
  updateToast(id, {
    title: `Close RFQ created (#${quotationId})`,
    description: txHash ? `tx: ${txHash.slice(0, 10)}...` : undefined,
    status: 'success',
    duration: 15000,
  });
}

export function toastRFQCancelled(): void {
  toast({ title: 'RFQ cancelled', status: 'success', duration: 15000 });
}

export function toastOfferReceived(quotationId: string): void {
  toast({ title: `New offer received on RFQ #${quotationId}`, status: 'warning', duration: 10000 });
}

export function toastSettling(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the settlement in your wallet.', status: 'loading', duration: null });
}

export function toastSettled(id: number): void {
  updateToast(id, { title: 'Offer accepted', status: 'success', duration: 15000 });
}

export function toastSettlementComplete(optionAddress: string): void {
  toast({ title: 'RFQ settled, option deployed', description: `option: ${optionAddress.slice(0, 10)}...`, status: 'success', duration: 8000 });
}

export function toastApproved(token: string): void {
  toast({ title: `${token} approved for trading`, status: 'success' });
}

export function toastApprovalFailed(reason: string): void {
  toast({ title: 'Approval failed', description: reason, status: 'error' });
}

export function toastInsufficientBalance(token: string): void {
  toast({ title: `Insufficient ${token} balance`, status: 'error' });
}

export function toastTxRejected(): void {
  toast({ title: 'Transaction rejected by user', status: 'error' });
}

export function toastSwapQuote(fromAmount: string, fromToken: string, toAmount: string, toToken: string): void {
  toast({ title: `Swap quote: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`, status: 'warning', duration: 10000 });
}

export function toastSwapAndRFQ(): void {
  toast({ title: 'Swap and RFQ created in one tx', status: 'success' });
}

export function toastWSConnected(): void {
  toast({ title: 'Connected to event stream', status: 'warning', duration: 2000 });
}

export function toastWSDisconnected(): void {
  toast({ title: 'Event stream disconnected', status: 'error' });
}

export function toastChainlinkError(): void {
  toast({ title: 'Failed to fetch spot prices', status: 'error' });
}

// MM toast messages
export function toastMMOfferSubmitting(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the offer in your wallet.', status: 'loading', duration: null });
}

export function toastMMOfferPlaced(id: number, quotationId: string): void {
  updateToast(id, { title: `Offer placed on RFQ #${quotationId}`, status: 'success', duration: 15000 });
}

export function toastMMRevealSubmitting(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the reveal in your wallet.', status: 'loading', duration: null });
}

export function toastMMRevealed(id: number, quotationId: string): void {
  updateToast(id, { title: `Offer revealed on RFQ #${quotationId}`, status: 'success', duration: 15000 });
}

export function toastMMWon(quotationId: string): void {
  toast({ title: `Your offer won RFQ #${quotationId}!`, status: 'success', duration: 8000 });
}

export function toastMMOutbid(quotationId: string): void {
  toast({ title: `Your offer on RFQ #${quotationId} was outbid`, status: 'warning', duration: 10000 });
}

export function toastMMLimitSettling(): number {
  return toast({ title: 'Confirm in wallet', description: 'Please confirm the limit order settlement in your wallet.', status: 'loading', duration: null });
}

export function toastMMLimitSettled(id: number, quotationId: string): void {
  updateToast(id, { title: `Settled RFQ #${quotationId} at reserve`, status: 'success', duration: 15000 });
}

export function toastRevealWindowOpen(quotationId: string): void {
  toast({ title: `Reveal window open for RFQ #${quotationId} — reveal your offer`, status: 'warning', duration: 10000 });
}
