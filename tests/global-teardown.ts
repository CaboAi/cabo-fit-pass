import { FullConfig } from '@playwright/test'
import { createClient } from '@/lib/supabase/client'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test resources...')
  
  try {
    await cleanupTestData()
    console.log('✅ E2E test cleanup completed')
  } catch (error) {
    console.warn('⚠️  E2E test cleanup had issues:', error)
  }
}

async function cleanupTestData() {
  console.log('Cleaning up test data...')
  
  try {
    const supabase = createClient()
    
    // Clean up test bookings (only test-related ones)
    await supabase
      .from('bookings')
      .delete()
      .like('user_id', '%test%')
    
    // Clean up test profiles (only test-related ones)
    await supabase
      .from('profiles')
      .delete()
      .like('email', '%test%')
    
    // Note: We keep test classes and studios for next test run
    // Only clean up user-generated test data
    
    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.warn('⚠️  Test data cleanup failed:', error)
  }
}

export default globalTeardown