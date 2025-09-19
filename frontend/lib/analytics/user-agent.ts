interface UserAgentInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'other' = 'desktop';
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/smart-tv|tv|googletv|appletv|hbbtv|pov_tv|netcast.tv/i.test(ua)) {
    deviceType = 'other';
  }
  
  // Detect browser and version
  let browser = 'Other';
  let browserVersion = '';
  
  if (/edg\//.test(ua)) {
    browser = 'Edge';
    browserVersion = ua.match(/edg\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/chrome\//.test(ua) && !/edg\//.test(ua)) {
    browser = 'Chrome';
    browserVersion = ua.match(/chrome\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/firefox\//.test(ua)) {
    browser = 'Firefox';
    browserVersion = ua.match(/firefox\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/safari\//.test(ua) && !/chrome\//.test(ua)) {
    browser = 'Safari';
    browserVersion = ua.match(/version\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/msie|trident/.test(ua)) {
    browser = 'Internet Explorer';
    browserVersion = ua.match(/(?:msie |rv:)(\d+\.?\d*)/)?.[1] || '';
  }
  
  // Detect OS and version
  let os = 'Other';
  let osVersion = '';
  
  if (/windows nt/.test(ua)) {
    os = 'Windows';
    const version = ua.match(/windows nt (\d+\.?\d*)/)?.[1];
    osVersion = windowsVersionMap[version || ''] || version || '';
  } else if (/mac os x/.test(ua)) {
    os = 'macOS';
    osVersion = ua.match(/mac os x (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (/android/.test(ua)) {
    os = 'Android';
    osVersion = ua.match(/android (\d+\.?\d*)/)?.[1] || '';
  } else if (/iphone|ipad|ipod/.test(ua)) {
    os = 'iOS';
    osVersion = ua.match(/os (\d+[._]\d+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (/linux/.test(ua)) {
    os = 'Linux';
  }
  
  return {
    deviceType,
    browser,
    browserVersion: browserVersion.split('.')[0], // Major version only
    os,
    osVersion,
  };
}

const windowsVersionMap: Record<string, string> = {
  '10.0': '10',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.2': 'XP',
  '5.1': 'XP',
};