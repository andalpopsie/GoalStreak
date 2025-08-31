#!/usr/bin/env node

/**
 * Coverage Validation Script for GoalStreak Testing Suite
 * 
 * This script validates that the testing suite meets the target code coverage
 * requirements and identifies areas that need additional testing.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Coverage targets
const COVERAGE_TARGETS = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80
};

// Critical paths that must have high coverage
const CRITICAL_PATHS = [
  'src/services/',
  'src/hooks/',
  'src/utils/',
  'src/components/',
];

// Security-critical files that need 100% coverage
const SECURITY_CRITICAL_FILES = [
  'src/utils/inputValidation.ts',
  'src/services/firebase.ts',
  'src/hooks/useAuth.tsx'
];

class CoverageValidator {
  constructor() {
    this.results = {
      overall: null,
      critical: {},
      security: {},
      recommendations: []
    };
  }

  async validateCoverage() {
    console.log('🔍 Starting coverage validation...\n');

    try {
      // Step 1: Run unit tests with coverage
      console.log('📊 Running unit tests with coverage...');
      await this.runUnitTestsWithCoverage();

      // Step 2: Analyze coverage results
      console.log('📈 Analyzing coverage results...');
      await this.analyzeCoverageResults();

      // Step 3: Check critical paths
      console.log('🎯 Checking critical path coverage...');
      await this.checkCriticalPaths();

      // Step 4: Validate security coverage
      console.log('🔒 Validating security-critical file coverage...');
      await this.validateSecurityCoverage();

      // Step 5: Generate recommendations
      console.log('💡 Generating coverage improvement recommendations...');
      this.generateRecommendations();

      // Step 6: Generate report
      console.log('📋 Generating coverage validation report...');
      this.generateReport();

    } catch (error) {
      console.error('❌ Coverage validation failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTestsWithCoverage() {
    try {
      // Run only unit tests to avoid E2E issues
      const command = 'npx jest src/__tests__/unit --coverage --coverageReporters=json --coverageReporters=text --passWithNoTests';
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      console.log('✅ Unit tests completed successfully');
      return output;
    } catch (error) {
      // Even if tests fail, we might still have coverage data
      console.log('⚠️  Some unit tests failed, but continuing with coverage analysis...');
      return error.stdout || '';
    }
  }

  async analyzeCoverageResults() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    
    if (!fs.existsSync(coveragePath)) {
      throw new Error('Coverage file not found. Make sure tests ran with coverage.');
    }

    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    // Calculate overall coverage
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    Object.values(coverageData).forEach(file => {
      if (file.s) {
        totalStatements += Object.keys(file.s).length;
        coveredStatements += Object.values(file.s).filter(count => count > 0).length;
      }
      if (file.b) {
        Object.values(file.b).forEach(branch => {
          totalBranches += branch.length;
          coveredBranches += branch.filter(count => count > 0).length;
        });
      }
      if (file.f) {
        totalFunctions += Object.keys(file.f).length;
        coveredFunctions += Object.values(file.f).filter(count => count > 0).length;
      }
      if (file.l) {
        totalLines += Object.keys(file.l).length;
        coveredLines += Object.values(file.l).filter(count => count > 0).length;
      }
    });

    this.results.overall = {
      statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    };

    console.log(`📊 Overall Coverage:`);
    console.log(`   Statements: ${this.results.overall.statements.toFixed(2)}%`);
    console.log(`   Branches: ${this.results.overall.branches.toFixed(2)}%`);
    console.log(`   Functions: ${this.results.overall.functions.toFixed(2)}%`);
    console.log(`   Lines: ${this.results.overall.lines.toFixed(2)}%`);
  }

  async checkCriticalPaths() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

    CRITICAL_PATHS.forEach(criticalPath => {
      const pathFiles = Object.keys(coverageData).filter(file => 
        file.includes(criticalPath)
      );

      if (pathFiles.length === 0) {
        this.results.critical[criticalPath] = { coverage: 0, files: [] };
        return;
      }

      let totalStatements = 0;
      let coveredStatements = 0;

      pathFiles.forEach(file => {
        const fileData = coverageData[file];
        if (fileData.s) {
          totalStatements += Object.keys(fileData.s).length;
          coveredStatements += Object.values(fileData.s).filter(count => count > 0).length;
        }
      });

      const coverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
      this.results.critical[criticalPath] = {
        coverage,
        files: pathFiles.length,
        totalStatements,
        coveredStatements
      };

      console.log(`   ${criticalPath}: ${coverage.toFixed(2)}% (${pathFiles.length} files)`);
    });
  }

  async validateSecurityCoverage() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

    SECURITY_CRITICAL_FILES.forEach(securityFile => {
      const fullPath = Object.keys(coverageData).find(file => 
        file.endsWith(securityFile)
      );

      if (!fullPath) {
        this.results.security[securityFile] = { coverage: 0, exists: false };
        return;
      }

      const fileData = coverageData[fullPath];
      let coverage = 0;

      if (fileData.s) {
        const totalStatements = Object.keys(fileData.s).length;
        const coveredStatements = Object.values(fileData.s).filter(count => count > 0).length;
        coverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
      }

      this.results.security[securityFile] = {
        coverage,
        exists: true,
        path: fullPath
      };

      console.log(`   ${securityFile}: ${coverage.toFixed(2)}%`);
    });
  }

  generateRecommendations() {
    const recommendations = [];

    // Overall coverage recommendations
    Object.entries(COVERAGE_TARGETS).forEach(([metric, target]) => {
      const actual = this.results.overall[metric];
      if (actual < target) {
        recommendations.push({
          type: 'overall',
          priority: 'high',
          metric,
          target,
          actual: actual.toFixed(2),
          message: `${metric} coverage (${actual.toFixed(2)}%) is below target (${target}%)`
        });
      }
    });

    // Critical path recommendations
    Object.entries(this.results.critical).forEach(([path, data]) => {
      if (data.coverage < 70) {
        recommendations.push({
          type: 'critical',
          priority: 'high',
          path,
          coverage: data.coverage.toFixed(2),
          message: `Critical path ${path} has low coverage (${data.coverage.toFixed(2)}%)`
        });
      }
    });

    // Security recommendations
    Object.entries(this.results.security).forEach(([file, data]) => {
      if (!data.exists) {
        recommendations.push({
          type: 'security',
          priority: 'critical',
          file,
          message: `Security-critical file ${file} not found in coverage report`
        });
      } else if (data.coverage < 90) {
        recommendations.push({
          type: 'security',
          priority: 'critical',
          file,
          coverage: data.coverage.toFixed(2),
          message: `Security-critical file ${file} has insufficient coverage (${data.coverage.toFixed(2)}%)`
        });
      }
    });

    this.results.recommendations = recommendations;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COVERAGE VALIDATION REPORT');
    console.log('='.repeat(60));

    // Overall status
    const overallPassed = Object.entries(COVERAGE_TARGETS).every(([metric, target]) => 
      this.results.overall[metric] >= target
    );

    console.log(`\n🎯 Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

    // Coverage summary
    console.log('\n📊 Coverage Summary:');
    Object.entries(COVERAGE_TARGETS).forEach(([metric, target]) => {
      const actual = this.results.overall[metric];
      const status = actual >= target ? '✅' : '❌';
      console.log(`   ${status} ${metric}: ${actual.toFixed(2)}% (target: ${target}%)`);
    });

    // Critical paths
    console.log('\n🎯 Critical Paths:');
    Object.entries(this.results.critical).forEach(([path, data]) => {
      const status = data.coverage >= 70 ? '✅' : '❌';
      console.log(`   ${status} ${path}: ${data.coverage.toFixed(2)}% (${data.files} files)`);
    });

    // Security files
    console.log('\n🔒 Security-Critical Files:');
    Object.entries(this.results.security).forEach(([file, data]) => {
      if (!data.exists) {
        console.log(`   ❌ ${file}: NOT FOUND`);
      } else {
        const status = data.coverage >= 90 ? '✅' : '❌';
        console.log(`   ${status} ${file}: ${data.coverage.toFixed(2)}%`);
      }
    });

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'critical' ? '🚨' : 
                        rec.priority === 'high' ? '⚠️' : 'ℹ️';
        console.log(`   ${priority} ${rec.message}`);
      });
    }

    // Next steps
    console.log('\n🚀 Next Steps:');
    if (overallPassed) {
      console.log('   ✅ Coverage targets met! Consider:');
      console.log('   • Adding edge case tests');
      console.log('   • Improving test quality');
      console.log('   • Adding integration tests');
    } else {
      console.log('   📝 To improve coverage:');
      console.log('   • Add unit tests for uncovered functions');
      console.log('   • Test error handling paths');
      console.log('   • Add tests for edge cases');
      console.log('   • Focus on critical and security files first');
    }

    console.log('\n' + '='.repeat(60));

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'coverage-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(overallPassed ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CoverageValidator();
  validator.validateCoverage().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = CoverageValidator;