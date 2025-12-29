import React from 'react'
import { Redirect } from 'expo-router'

export default function IndexRedirect() {
  return <Redirect href='/(tabs)' />
}