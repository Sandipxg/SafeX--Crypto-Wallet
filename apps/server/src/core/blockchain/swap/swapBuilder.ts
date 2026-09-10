import { encodeFunctionData, formatEther } from 'viem'
import { getPublicClient } from '../client/publicClient.js'
import { validateEvmAddress } from '../utils/address.js'
import { getPendingNonce } from '../read/nonce.js'
import {
  getDexConfig,
  uniswapV2RouterAbi,
  NATIVE_ETH_ADDRESS,
} from './constants.js'
import { fetchSwapQuote, SwapQuoteResult } from './quote.js'

export interface BuildSwapTxParams {
  userAddress: string
  tokenInAddress: string
  tokenOutAddress: string
  amountInFormatted: string
  slippageTolerancePercent?: number
  deadlineMinutes?: number
  chainId?: number
}

export interface PreparedSwapTx {
  to: `0x${string}`
  valueEth: string
  valueWei: string
  data: `0x${string}`
  nonce: number
  gasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  estimatedTotalFeeWei: string
  chainId: number
  deadline: number
  quote: SwapQuoteResult
  swapType: 'ETH_TO_TOKEN' | 'TOKEN_TO_ETH' | 'TOKEN_TO_TOKEN'
}

/**
 * Builds an unsigned EIP-1559 transaction request for Uniswap V2 AMM execution
 */
export async function buildSwapTransaction(
  params: BuildSwapTxParams
): Promise<PreparedSwapTx> {
  const chainId = params.chainId ?? 11155111
  const validUser = validateEvmAddress(params.userAddress)
  const config = getDexConfig(chainId)
  const client = getPublicClient(chainId)

  const quote = await fetchSwapQuote({
    tokenInAddress: params.tokenInAddress,
    tokenOutAddress: params.tokenOutAddress,
    amountInFormatted: params.amountInFormatted,
    slippageTolerancePercent: params.slippageTolerancePercent ?? 0.5,
    chainId,
  })

  const deadlineMinutes = params.deadlineMinutes ?? 20
  const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60
  const deadlineBigInt = BigInt(deadline)

  const amountInRaw = BigInt(quote.amountInRaw)
  const minAmountOutRaw = BigInt(quote.minAmountOutRaw)

  let data: `0x${string}`
  let valueWei = 0n
  let valueEth = '0'
  let swapType: 'ETH_TO_TOKEN' | 'TOKEN_TO_ETH' | 'TOKEN_TO_TOKEN'

  if (quote.tokenIn.isNative) {
    // ETH -> ERC20: swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
    swapType = 'ETH_TO_TOKEN'
    valueWei = amountInRaw
    valueEth = params.amountInFormatted

    data = encodeFunctionData({
      abi: uniswapV2RouterAbi,
      functionName: 'swapExactETHForTokens',
      args: [minAmountOutRaw, quote.path, validUser, deadlineBigInt],
    })
  } else if (quote.tokenOut.isNative) {
    // ERC20 -> ETH: swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    swapType = 'TOKEN_TO_ETH'
    valueWei = 0n
    valueEth = '0'

    data = encodeFunctionData({
      abi: uniswapV2RouterAbi,
      functionName: 'swapExactTokensForETH',
      args: [amountInRaw, minAmountOutRaw, quote.path, validUser, deadlineBigInt],
    })
  } else {
    // ERC20 -> ERC20: swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    swapType = 'TOKEN_TO_TOKEN'
    valueWei = 0n
    valueEth = '0'

    data = encodeFunctionData({
      abi: uniswapV2RouterAbi,
      functionName: 'swapExactTokensForTokens',
      args: [amountInRaw, minAmountOutRaw, quote.path, validUser, deadlineBigInt],
    })
  }

  // Fetch nonce with resilient fallbacks
  let nonce = 0
  try {
    nonce = await getPendingNonce(validUser, chainId)
  } catch (nonceErr) {
    console.warn('[buildSwapTransaction] getPendingNonce failed, trying latest block count:', nonceErr)
    try {
      nonce = await client.getTransactionCount({
        address: validUser,
        blockTag: 'latest',
      })
    } catch {
      nonce = 0
    }
  }

  // Fetch fees with network fallbacks
  let maxFee = 35000000000n
  let priorityFee = 2000000000n
  try {
    const fees = await client.estimateFeesPerGas()
    if (fees.maxFeePerGas) maxFee = fees.maxFeePerGas
    if (fees.maxPriorityFeePerGas) priorityFee = fees.maxPriorityFeePerGas
  } catch (feeErr) {
    console.warn('[buildSwapTransaction] estimateFeesPerGas failed, using standard defaults:', feeErr)
  }

  // Gas units estimation with safety buffer
  let gasLimit: bigint
  try {
    const estimatedGas = await client.estimateGas({
      account: validUser,
      to: config.routerAddress,
      value: valueWei,
      data,
    })
    // 25% safety margin for router execution
    gasLimit = (estimatedGas * 125n) / 100n
  } catch {
    // Typical multi-hop swap on Uniswap V2 router consumes 140,000 - 220,000 gas
    gasLimit = quote.isDirectRoute ? 180000n : 240000n
  }

  const totalFeeWei = gasLimit * maxFee

  return {
    to: config.routerAddress,
    valueEth,
    valueWei: valueWei.toString(),
    data,
    nonce,
    gasLimit: gasLimit.toString(),
    maxFeePerGas: maxFee.toString(),
    maxPriorityFeePerGas: priorityFee.toString(),
    estimatedTotalFeeWei: totalFeeWei.toString(),
    chainId,
    deadline,
    quote,
    swapType,
  }
}
