import {
  HTTPClient,
  EVMClient,
  getNetwork,
  hexToBase64,
  bytesToHex,
  TxStatus,
  ignore,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { Config } from "../utils/config";

// ExternalApiResponse is used to parse the nested JSON from the external API
export type ExternalApiResponse = {
  success: boolean;
  data: Array<{
    deviceId: number;
    projectName: string;
    creditQuality: number;
    greenImpact: number;
    totalReadings: number;
    averageOutput: number;
    maxOutput: number;
    minOutput: number;
    averageEfficiency: number;
    timestamp: string;
  }>;
  count: number;
};

export const writeDataOnchain = (runtime: Runtime<Config>): string => {
  // Get network info
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: runtime.config.chainSelectorName,
    isTestnet: true,
  });

  runtime.log(`Selected network: ${network}`);

  if (!network) {
    throw new Error(`Network not found: ${runtime.config.chainSelectorName}`);
  }

  // Create EVM client
  const evmClient = new EVMClient(network.chainSelector.selector);

  // Step 1: Fetch offchain data
  const offchainValue = runtime
    .runInNodeMode(fetchAndParseData, ignore())()
    .result();
  runtime.log(
    `Successfully fetched offchain value: ${JSON.stringify(offchainValue, null, 2)}`,
  );

  // Map API response data to the ABI structure
  const reportData = encodeAbiParameters(
    parseAbiParameters("((uint8,uint8),uint256,string)[]"),
    [
      offchainValue.data.map(
        (item) =>
          [
            [item.creditQuality, item.greenImpact] as const, // ImpactScore { creditQuality, greenImpact }
            BigInt(item.deviceId), // projectId as uint256
            "", // projectURI (project name or metadata URI)
          ] as const,
      ),
    ],
  );

  runtime.log(`Encoded data for consumer contract`);

  // 2. Generate signed report
  const reportResponse = runtime
    .report({
      encodedPayload: hexToBase64(reportData),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  runtime.log(`Generated signed report`);

  // 3. Submit to blockchain
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: runtime.config.consumerAddress,
      report: reportResponse,
      gasConfig: {
        gasLimit: runtime.config.gasLimit,
      },
    })
    .result();

  // 4. Check status and return
  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
    runtime.log(`Transaction successful: ${txHash}`);
    runtime.log(
      `View transaction at https://sepolia.etherscan.io/tx/${txHash}`,
    );
    return txHash;
  }

  throw new Error(`Transaction failed with status: ${writeResult.txStatus}`);
};

const fetchAndParseData = (
  nodeRuntime: NodeRuntime<Config>,
): ExternalApiResponse => {
  const httpClient = new HTTPClient();

  const req = {
    url: nodeRuntime.config.apiUrl,
    method: "GET" as const,
  };

  const resp = httpClient.sendRequest(nodeRuntime, req).result();
  const bodyText = new TextDecoder().decode(resp.body);
  console.log(`Raw API response:\n${bodyText}`);

  const externalResp = JSON.parse(bodyText) as ExternalApiResponse;

  return externalResp;
};
