/**
 * Detox Artifacts Path Builder
 * Customizes the path structure for test artifacts (screenshots, videos, logs)
 */

const path = require('path');

module.exports = {
  buildPathForTestArtifact: (artifactName, testSummary) => {
    const platform = process.env.DETOX_CONFIGURATION?.includes('ios') ? 'ios' : 'android';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Extract test information
    const testName = testSummary.title.replace(/[^a-zA-Z0-9]/g, '_');
    const suiteName = testSummary.ancestorTitles.join('_').replace(/[^a-zA-Z0-9]/g, '_');
    const status = testSummary.status; // 'passed', 'failed', 'pending', 'todo'
    
    // Build organized path structure
    const artifactPath = path.join(
      platform,
      status,
      suiteName,
      `${testName}_${timestamp}_${artifactName}`
    );
    
    return artifactPath;
  }
};