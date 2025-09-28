import { Account, Client } from 'react-native-appwrite';

export const client = new Client()
.setEndpoint(process.env.EXPO_PUBLIC_API_ENDPOINT!)
.setProject(process.env.EXPO_PUBLIC_API_PROJECT!)
.setPlatform(process.env.EXPO_PUBLIC_API_PLATFORM!);

export  const account = new Account(client)