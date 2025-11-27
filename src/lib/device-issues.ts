export const DEVICE_ISSUES = [
  // Screen Issues
  'Screen cracked',
  'Screen not working',
  'Screen black/blank',
  'Screen flickering',
  'Screen touch not responding',
  'Screen has lines',
  'Screen has dead pixels',
  'Screen replacement needed',
  'LCD damage',
  'OLED burn-in',
  
  // Battery Issues
  'Battery drains quickly',
  'Battery not charging',
  'Battery swollen',
  'Battery replacement needed',
  'Phone shuts down unexpectedly',
  'Battery overheating',
  
  // Charging Issues
  'Charging port not working',
  'Charging port damaged',
  'Charging slowly',
  'Not charging at all',
  'Charging port loose',
  'Wireless charging not working',
  
  // Water Damage
  'Water damage',
  'Liquid damage',
  'Phone got wet',
  'Moisture detected',
  
  // Audio Issues
  'Speaker not working',
  'Earpiece not working',
  'Microphone not working',
  'No sound',
  'Distorted audio',
  'Headphone jack not working',
  
  // Camera Issues
  'Camera not working',
  'Camera blurry',
  'Front camera not working',
  'Rear camera not working',
  'Camera app crashes',
  'Flash not working',
  
  // Software Issues
  'Phone frozen',
  'Phone stuck on boot',
  'App crashes',
  'Slow performance',
  'Software update needed',
  'Factory reset needed',
  'Operating system issue',
  
  // Button Issues
  'Power button not working',
  'Volume buttons not working',
  'Home button not working',
  'Buttons stuck',
  
  // Network Issues
  'WiFi not working',
  'Bluetooth not working',
  'No signal',
  'Weak signal',
  'SIM card not detected',
  'Network connectivity issues',
  
  // Physical Damage
  'Back glass cracked',
  'Frame bent',
  'Housing damage',
  'Physical damage',
  
  // Other Common Issues
  'Phone overheats',
  'Phone restarts randomly',
  'Storage full',
  'Memory issues',
  'Data recovery needed',
  'Unlock needed',
  'Screen protector replacement',
  'Case replacement',
];

/**
 * Get device issue suggestions based on search query
 */
export function getIssueSuggestions(query: string): string[] {
  if (!query.trim()) {
    return DEVICE_ISSUES.slice(0, 10); // Return first 10 when no search
  }
  
  const lowerQuery = query.toLowerCase();
  return DEVICE_ISSUES.filter((issue) =>
    issue.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit to 10 suggestions
}

