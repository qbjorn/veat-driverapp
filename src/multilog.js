import { ref } from 'vue';
import gql from 'graphql-tag';
import { useQuery, useMutation  } from '@vue/apollo-composable';

const MULTILOG_INIT_QUERY = gql`
  query MultiLogInit($clientToken: String, $userId: String) {
    multiLogInit(userId: $userId, clientToken: $clientToken) {
      clientToken
      apiToken
      userId
    }
  }
`;

const MULTILOG_LOG_MUTATION = gql`
  mutation MultiLog(
    $logLevel: Int!,
    $apiToken: String,
    $clientToken: String,
    $gqlToken: String,
    $userId: String,
    $machineId: String,
    $logPath: String,
    $logText: String
  ) {
    multiLog(
      logLevel: $logLevel,
      apiToken: $apiToken,
      clientToken: $clientToken,
      gqlToken: $gqlToken,
      userId: $userId,
      machineId: $machineId,
      logPath: $logPath,
      logText: $logText
    ) {
      logLevel,
      apiToken,
      clientToken,
      gqlToken,
      userId,
      machineId,
      logPath,
      logText
    }
  }
`;

const multilogSetup = () => {
  const multilog = ref({});
  
  // Define your initialization logic
  async function multilogInit(clientToken, userId) {
    const { result: data } = useQuery(MULTILOG_INIT_QUERY, { clientToken, userId });
    return data.multiLogInit;
  }
  
  // Define your mutation logic
  async function multilogLogMutation(logLevel, apiToken, clientToken, gqlToken, userId, machineId, logPath, logText) {
    const variables = {
      logLevel,
      apiToken,
      clientToken,
      gqlToken,
      userId,
      machineId,
      logPath,
      logText,
    };
    
    const { result: data } = useMutation(MULTILOG_LOG_MUTATION, variables);
    return data.multiLog;
  }
  
  // Assign the logic to multilog object
  multilog.value = {
    multilogInit: multilogInit,
    multilogLogMutation: multilogLogMutation,
  };

  return multilog;
}

export default multilogSetup();