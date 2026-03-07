import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

// NOTE: The Seeker runs Android, so we check two things:
// 1. The device's build model string (hardware level check)
// 2. After wallet connect, the wallet URI (software level check via walletService)
// Either being true means the user is on a Seeker.

export const useSeeker = () => {
  const [isSeekerDevice, setIsSeekerDevice] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    // Check Android device model via RN's Platform module
    const model = (Platform.constants as any)?.Model ?? ''
    const manufacturer = (Platform.constants as any)?.Manufacturer ?? ''

    if (
      model.toLowerCase().includes('seeker') ||
      manufacturer.toLowerCase().includes('solanamobile')
    ) {
      setIsSeekerDevice(true)
    }
  }, [])

  return { isSeekerDevice }
}
