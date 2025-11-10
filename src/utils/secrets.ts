// エンタープライズ環境での秘密管理

// AWS Secrets Manager
export const getAWSSecret = async (secretName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('秘密情報はサーバーサイドでのみ取得可能');
  }

  const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
  
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  
  try {
    const response = await client.send(command);
    return JSON.parse(response.SecretString || '{}');
  } catch (error) {
    console.error('Failed to get secret:', error);
    throw error;
  }
};

// Google Secret Manager
export const getGCPSecret = async (secretName: string, version: string = 'latest') => {
  if (typeof window !== 'undefined') {
    throw new Error('秘密情報はサーバーサイドでのみ取得可能');
  }

  const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
  
  const client = new SecretManagerServiceClient();
  const name = `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/${version}`;
  
  try {
    const [version] = await client.accessSecretVersion({ name });
    return version.payload?.data?.toString();
  } catch (error) {
    console.error('Failed to get secret:', error);
    throw error;
  }
};

// Azure Key Vault
export const getAzureSecret = async (secretName: string) => {
  if (typeof window !== 'undefined') {
    throw new Error('秘密情報はサーバーサイドでのみ取得可能');
  }

  const { SecretClient } = await import('@azure/keyvault-secrets');
  const { DefaultAzureCredential } = await import('@azure/identity');
  
  const credential = new DefaultAzureCredential();
  const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`;
  const client = new SecretClient(vaultUrl, credential);
  
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error('Failed to get secret:', error);
    throw error;
  }
};

// 統一インターファース
export const getSecret = async (key: string): Promise<string> => {
  const provider = process.env.SECRET_PROVIDER || 'env';
  
  switch (provider) {
    case 'aws': {
      const awsSecrets = await getAWSSecret(process.env.AWS_SECRET_NAME || 'app-secrets');
      return awsSecrets[key];
    }
      
    case 'gcp':
      return await getGCPSecret(key);
      
    case 'azure':
      return await getAzureSecret(key);
      
    case 'env':
    default:
      return process.env[key] || '';
  }
};