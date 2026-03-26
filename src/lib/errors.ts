export const parseErrorMessage = (
  error: any
): { title: string; message: string } => {
  const code = error?.code || error?.info?.error?.code;
  const reason = error?.reason;

  if (code === 'ACTION_REJECTED' || code === 4001 || reason === 'rejected') {
    return {
      title: 'Transaction Rejected',
      message: 'User denied transaction signature.',
    };
  }

  if (code === 'INSUFFICIENT_FUNDS' || code === -32000) {
    return {
      title: 'Insufficient Funds',
      message: 'Not enough funds to complete this transaction.',
    };
  }

  if (code === 'UNPREDICTABLE_GAS_LIMIT') {
    return {
      title: 'Transaction Would Fail',
      message: error?.reason || 'The transaction is likely to revert.',
    };
  }

  if (code === 'NETWORK_ERROR' || code === 'SERVER_ERROR') {
    return {
      title: 'Network Error',
      message: 'Could not connect to the network. Please try again.',
    };
  }

  if (code === 'NONCE_EXPIRED' || code === -32003) {
    return {
      title: 'Transaction Error',
      message: 'Nonce has already been used. Please try again.',
    };
  }

  if (code === 'CALL_EXCEPTION') {
    const revertReason =
      error?.reason || error?.data?.message || 'Transaction reverted on-chain.';
    return { title: 'Transaction Reverted', message: revertReason };
  }

  const raw =
    error?.shortMessage || error?.reason || error?.message || String(error);
  return {
    title: 'Trade Failed',
    message: raw.length > 200 ? raw.slice(0, 200) + '...' : raw,
  };
};
