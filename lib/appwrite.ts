import { Account, Client } from 'react-native-appwrite';



export const client = new Client()
.setEndpoint('https://fra.cloud.appwrite.io/v1')
.setProject('6883893900103a32f032')
.setPlatform('com.catus_apps.gps');

export const account = new Account(client)