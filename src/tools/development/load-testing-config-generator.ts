import type { Tool, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface LoadTestingConfig {
  testType: 'stress' | 'load' | 'spike' | 'volume' | 'endurance';
  framework: 'jmeter' | 'k6' | 'artillery' | 'locust' | 'wrk' | 'vegeta';
  targetUrl: string;
  duration: number;
  virtualUsers: number;
  rampUpTime: number;
  iterations?: number;
  thinkTime: number;
  requestTimeout: number;
  includeHeaders: boolean;
  includeAuth: boolean;
  authType: 'bearer' | 'basic' | 'apikey' | 'oauth2';
  includeDataGeneration: boolean;
  dataType: 'csv' | 'json' | 'random';
  reportFormat: 'html' | 'json' | 'csv' | 'junit' | 'all';
  includeMetrics: boolean;
  includeAssertions: boolean;
  distributedTesting: boolean;
  nodeCount: number;
}

const DEFAULT_CONFIG: LoadTestingConfig = {
  testType: 'load',
  framework: 'k6',
  targetUrl: 'https://api.example.com',
  duration: 300,
  virtualUsers: 50,
  rampUpTime: 30,
  thinkTime: 1,
  requestTimeout: 30,
  includeHeaders: true,
  includeAuth: false,
  authType: 'bearer',
  includeDataGeneration: false,
  dataType: 'json',
  reportFormat: 'html',
  includeMetrics: true,
  includeAssertions: true,
  distributedTesting: false,
  nodeCount: 3
};

function generateK6Config(config: LoadTestingConfig): string {
  const testConfig = {
    scenarios: {
      [config.testType]: {
        executor: config.testType === 'spike' ? 'ramping-vus' : 'ramping-vus',
        startVUs: 0,
        stages: generateStages(config),
        gracefulRampDown: '30s',
      },
    },
    thresholds: config.includeAssertions ? {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.1'],
      http_reqs: ['rate>10'],
    } : {},
  };

  let script = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let options = ${JSON.stringify(testConfig, null, 2)};

const errorRate = new Rate('errors');

export default function() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      ${config.includeAuth && config.authType === 'bearer' ? `'Authorization': 'Bearer YOUR_TOKEN_HERE',` : ''}
      ${config.includeAuth && config.authType === 'apikey' ? `'X-API-Key': 'YOUR_API_KEY_HERE',` : ''}
    },
    timeout: '${config.requestTimeout}s',
  };

  let response = http.get('${config.targetUrl}', params);
  
  ${config.includeAssertions ? `
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'body contains data': (r) => r.body.length > 0,
  }) || errorRate.add(1);` : ''}
  
  sleep(${config.thinkTime});
}

export function handleSummary(data) {
  return {
    ${config.reportFormat === 'html' || config.reportFormat === 'all' ? `'summary.html': htmlReport(data),` : ''}
    ${config.reportFormat === 'json' || config.reportFormat === 'all' ? `'summary.json': JSON.stringify(data),` : ''}
    ${config.reportFormat === 'junit' || config.reportFormat === 'all' ? `'junit.xml': junitReport(data),` : ''}
  };
}`;

  if (config.includeDataGeneration) {
    script = `${script}

// Data generation functions
function generateTestData() {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test User ' + Math.floor(Math.random() * 1000),
    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com'
  };
}`;
  }

  return script;
}

function generateJMeterConfig(config: LoadTestingConfig): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${config.testType} Test Plan">
      <stringProp name="TestPlan.comments">Generated load test configuration</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${config.testType} Thread Group">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControllerGui" testclass="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">${config.iterations || -1}</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${config.virtualUsers}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${config.rampUpTime}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${config.duration}</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="HTTP Request">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${extractDomain(config.targetUrl)}</stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol">${extractProtocol(config.targetUrl)}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">${extractPath(config.targetUrl)}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout">${config.requestTimeout * 1000}</stringProp>
          <stringProp name="HTTPSampler.response_timeout">${config.requestTimeout * 1000}</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          ${config.includeHeaders ? `
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-Type</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
              ${config.includeAuth && config.authType === 'bearer' ? `
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Authorization</stringProp>
                <stringProp name="Header.value">Bearer YOUR_TOKEN_HERE</stringProp>
              </elementProp>` : ''}
            </collectionProp>
          </HeaderManager>
          <hashTree/>` : ''}
          
          ${config.includeAssertions ? `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Assertion">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message"></stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">1</intProp>
          </ResponseAssertion>
          <hashTree/>` : ''}
          
          <UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Uniform Random Timer">
            <stringProp name="ConstantTimer.delay">${config.thinkTime * 1000}</stringProp>
            <stringProp name="RandomTimer.range">1000</stringProp>
          </UniformRandomTimer>
          <hashTree/>
        </hashTree>
        ${config.includeMetrics ? `
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename">results.jtl</stringProp>
        </ResultCollector>
        <hashTree/>` : ''}
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;
}

function generateArtilleryConfig(config: LoadTestingConfig): string {
  return `config:
  target: '${config.targetUrl}'
  phases:
    - duration: ${config.rampUpTime}
      arrivalRate: 1
      rampTo: ${Math.floor(config.virtualUsers / config.rampUpTime)}
    - duration: ${config.duration - config.rampUpTime - 30}
      arrivalRate: ${Math.floor(config.virtualUsers / config.rampUpTime)}
    - duration: 30
      arrivalRate: ${Math.floor(config.virtualUsers / config.rampUpTime)}
      rampTo: 0
  timeout: ${config.requestTimeout}
  ${config.includeHeaders ? `
  defaults:
    headers:
      'Content-Type': 'application/json'
      ${config.includeAuth && config.authType === 'bearer' ? `'Authorization': 'Bearer YOUR_TOKEN_HERE'` : ''}
      ${config.includeAuth && config.authType === 'apikey' ? `'X-API-Key': 'YOUR_API_KEY_HERE'` : ''}` : ''}
  ${config.includeAssertions ? `
  ensure:
    - statusCode: 200
    - contentType: json
    - hasProperty: data` : ''}
  ${config.includeMetrics ? `
  plugins:
    metrics-by-endpoint: {}
    hdr-histogram: {}` : ''}

scenarios:
  - name: "${config.testType} test"
    weight: 100
    flow:
      - get:
          url: "/"
          ${config.includeAssertions ? `
          capture:
            - json: "$.data"
              as: "responseData"
          expect:
            - statusCode: 200
            - contentType: json` : ''}
      - think: ${config.thinkTime}
      ${config.includeDataGeneration ? `
      - post:
          url: "/api/data"
          json:
            id: "{{ $randomInt(1, 10000) }}"
            name: "Test User {{ $randomInt(1, 1000) }}"
            email: "test{{ $randomInt(1, 1000) }}@example.com"` : ''}`;
}

function generateLocustConfig(config: LoadTestingConfig): string {
  return `import time
import random
from locust import HttpUser, task, between

class ${config.testType.charAt(0).toUpperCase() + config.testType.slice(1)}User(HttpUser):
    wait_time = between(${config.thinkTime * 0.5}, ${config.thinkTime * 1.5})
    
    def on_start(self):
        """Called when a user starts"""
        ${config.includeAuth ? `
        # Add authentication here
        self.auth_token = "YOUR_TOKEN_HERE"
        self.client.headers.update({
            'Content-Type': 'application/json',
            ${config.authType === 'bearer' ? `'Authorization': f'Bearer {self.auth_token}'` : ''}
            ${config.authType === 'apikey' ? `'X-API-Key': self.auth_token` : ''}
        })` : `
        self.client.headers.update({'Content-Type': 'application/json'})`}
    
    @task(3)
    def get_main_page(self):
        """Main page request"""
        with self.client.get("/", 
                           timeout=${config.requestTimeout},
                           catch_response=True) as response:
            ${config.includeAssertions ? `
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")` : `
            pass`}
    
    ${config.includeDataGeneration ? `
    @task(1)
    def post_data(self):
        """Post test data"""
        test_data = {
            'id': random.randint(1, 10000),
            'name': f'Test User {random.randint(1, 1000)}',
            'email': f'test{random.randint(1, 1000)}@example.com'
        }
        
        with self.client.post("/api/data", 
                            json=test_data,
                            timeout=${config.requestTimeout},
                            catch_response=True) as response:
            ${config.includeAssertions ? `
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")` : `
            pass`}` : ''}

# Run configuration
if __name__ == "__main__":
    import os
    from locust.main import main
    
    # Set environment variables for the test
    os.environ.setdefault("LOCUST_HOST", "${config.targetUrl}")
    os.environ.setdefault("LOCUST_USERS", "${config.virtualUsers}")
    os.environ.setdefault("LOCUST_SPAWN_RATE", "${Math.floor(config.virtualUsers / config.rampUpTime)}")
    os.environ.setdefault("LOCUST_RUN_TIME", "${config.duration}s")
    ${config.reportFormat === 'html' || config.reportFormat === 'all' ? `os.environ.setdefault("LOCUST_HTML", "report.html")` : ''}
    ${config.reportFormat === 'csv' || config.reportFormat === 'all' ? `os.environ.setdefault("LOCUST_CSV", "results")` : ''}
    
    main()`;
}

function generateStages(config: LoadTestingConfig) {
  const stages = [];
  
  switch (config.testType) {
    case 'load':
      stages.push(
        { duration: `${config.rampUpTime}s`, target: config.virtualUsers },
        { duration: `${config.duration - config.rampUpTime - 30}s`, target: config.virtualUsers },
        { duration: '30s', target: 0 }
      );
      break;
      
    case 'stress':
      stages.push(
        { duration: `${config.rampUpTime}s`, target: config.virtualUsers },
        { duration: `${Math.floor(config.duration / 3)}s`, target: config.virtualUsers * 2 },
        { duration: `${Math.floor(config.duration / 3)}s`, target: config.virtualUsers * 3 },
        { duration: '30s', target: 0 }
      );
      break;
      
    case 'spike':
      stages.push(
        { duration: '30s', target: config.virtualUsers },
        { duration: '10s', target: config.virtualUsers * 5 },
        { duration: '30s', target: config.virtualUsers },
        { duration: '30s', target: 0 }
      );
      break;
      
    case 'volume':
      stages.push(
        { duration: `${config.rampUpTime}s`, target: config.virtualUsers * 2 },
        { duration: `${config.duration - config.rampUpTime - 30}s`, target: config.virtualUsers * 2 },
        { duration: '30s', target: 0 }
      );
      break;
      
    case 'endurance':
      stages.push(
        { duration: `${config.rampUpTime}s`, target: config.virtualUsers },
        { duration: `${config.duration - config.rampUpTime - 30}s`, target: config.virtualUsers },
        { duration: '30s', target: 0 }
      );
      break;
  }
  
  return stages;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

function extractProtocol(url: string): string {
  try {
    return new URL(url).protocol.replace(':', '');
  } catch {
    return 'https';
  }
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname + new URL(url).search;
  } catch {
    return '/';
  }
}

function generateDockerCompose(config: LoadTestingConfig): string {
  if (!config.distributedTesting) return '';
  
  return `version: '3.8'

services:
  ${config.framework}-master:
    image: ${getDockerImage(config.framework)}
    command: ${getDockerCommand(config.framework, 'master')}
    ports:
      - "8089:8089"  # Web UI port (for Locust)
      - "5557:5557"  # Master communication port
    volumes:
      - .:/load-tests
    environment:
      - TARGET_URL=${config.targetUrl}
      - USERS=${config.virtualUsers}
      - SPAWN_RATE=${Math.floor(config.virtualUsers / config.rampUpTime)}
      - RUN_TIME=${config.duration}s

${Array.from({ length: config.nodeCount }, (_, i) => `
  ${config.framework}-worker-${i + 1}:
    image: ${getDockerImage(config.framework)}
    command: ${getDockerCommand(config.framework, 'worker')}
    volumes:
      - .:/load-tests
    depends_on:
      - ${config.framework}-master
    environment:
      - TARGET_URL=${config.targetUrl}
      - MASTER_HOST=${config.framework}-master`).join('')}

networks:
  default:
    name: load-testing-network`;
}

function getDockerImage(framework: string): string {
  switch (framework) {
    case 'k6': return 'grafana/k6:latest';
    case 'jmeter': return 'justb4/jmeter:latest';
    case 'artillery': return 'artilleryio/artillery:latest';
    case 'locust': return 'locustio/locust:latest';
    case 'wrk': return 'williamyeh/wrk:latest';
    case 'vegeta': return 'peterevans/vegeta:latest';
    default: return 'grafana/k6:latest';
  }
}

function getDockerCommand(framework: string, mode: 'master' | 'worker'): string {
  switch (framework) {
    case 'k6':
      return 'k6 run --out json=results.json /load-tests/test.js';
    case 'locust':
      return mode === 'master' 
        ? 'locust -f /load-tests/locustfile.py --master --web-host=0.0.0.0'
        : 'locust -f /load-tests/locustfile.py --worker --master-host=$MASTER_HOST';
    case 'jmeter':
      return mode === 'master'
        ? 'jmeter -n -t /load-tests/test-plan.jmx -l /load-tests/results.jtl -e -o /load-tests/report'
        : 'jmeter-server';
    default:
      return 'k6 run /load-tests/test.js';
  }
}

function generateConfigurationGuide(config: LoadTestingConfig): string {
  return `# Load Testing Configuration Guide

## Test Configuration
- **Test Type**: ${config.testType.charAt(0).toUpperCase() + config.testType.slice(1)}
- **Framework**: ${config.framework.toUpperCase()}
- **Target URL**: ${config.targetUrl}
- **Duration**: ${config.duration} seconds (${Math.floor(config.duration / 60)} minutes)
- **Virtual Users**: ${config.virtualUsers}
- **Ramp-up Time**: ${config.rampUpTime} seconds

## Setup Instructions

### Prerequisites
1. Install ${config.framework}:
${getInstallInstructions(config.framework)}

2. Save the generated configuration to appropriate files:
${getFileInstructions(config.framework)}

### Running the Test
${getRunInstructions(config.framework, config)}

### Key Metrics to Monitor
- **Response Time**: P95 should be < 500ms for good user experience
- **Error Rate**: Should be < 1% for production systems
- **Throughput**: Requests per second handled by the system
- **Resource Utilization**: CPU, Memory, Network usage

### Test Types Explained
- **Load Test**: Normal expected traffic to verify system works under typical conditions
- **Stress Test**: Beyond normal capacity to find breaking point
- **Spike Test**: Sudden traffic increases to test auto-scaling
- **Volume Test**: Large amounts of data to test data handling
- **Endurance Test**: Extended periods to find memory leaks and performance degradation

### Best Practices
1. Start with smoke tests (1-2 users) to verify script works
2. Gradually increase load to find baseline performance
3. Monitor both client-side metrics and server-side resources
4. Run tests in environment similar to production
5. Coordinate with stakeholders before running high-load tests
6. Clean up test data after completion

### Troubleshooting
- High error rates: Check server logs, reduce load, verify endpoints
- Timeout errors: Increase timeout values, check network connectivity
- Memory issues: Reduce virtual users, optimize test scripts
- SSL/TLS errors: Verify certificates, update client configurations

## Results Analysis
${getResultsAnalysisGuide(config.framework, config.reportFormat)}`;
}

function getInstallInstructions(framework: string): string {
  switch (framework) {
    case 'k6':
      return `   - macOS: \`brew install k6\`
   - Linux: \`sudo apt-get install k6\`
   - Windows: \`choco install k6\`
   - Docker: \`docker pull grafana/k6\``;
    
    case 'jmeter':
      return `   - Download from: https://jmeter.apache.org/download_jmeter.cgi
   - Extract and add bin/ directory to PATH
   - Docker: \`docker pull justb4/jmeter\``;
    
    case 'artillery':
      return `   - npm: \`npm install -g artillery\`
   - Docker: \`docker pull artilleryio/artillery\``;
    
    case 'locust':
      return `   - pip: \`pip install locust\`
   - Docker: \`docker pull locustio/locust\``;
    
    case 'wrk':
      return `   - Ubuntu: \`sudo apt-get install wrk\`
   - macOS: \`brew install wrk\`
   - Build from source: https://github.com/wg/wrk`;
    
    case 'vegeta':
      return `   - Download from: https://github.com/tsenart/vegeta/releases
   - Docker: \`docker pull peterevans/vegeta\``;
    
    default:
      return '   - See framework documentation for installation instructions';
  }
}

function getFileInstructions(framework: string): string {
  switch (framework) {
    case 'k6': return '   - Save script as `test.js`';
    case 'jmeter': return '   - Save as `test-plan.jmx`';
    case 'artillery': return '   - Save as `artillery.yml`';
    case 'locust': return '   - Save as `locustfile.py`';
    case 'wrk': return '   - Save script as `wrk-script.lua` (if using Lua script)';
    case 'vegeta': return '   - Save targets as `targets.txt`';
    default: return '   - Follow framework naming conventions';
  }
}

function getRunInstructions(framework: string, config: LoadTestingConfig): string {
  switch (framework) {
    case 'k6':
      return `\`\`\`bash
k6 run test.js
# With options:
k6 run --vus ${config.virtualUsers} --duration ${config.duration}s test.js
\`\`\``;
    
    case 'jmeter':
      return `\`\`\`bash
jmeter -n -t test-plan.jmx -l results.jtl -e -o report/
# Distributed mode:
jmeter -n -t test-plan.jmx -r -l results.jtl
\`\`\``;
    
    case 'artillery':
      return `\`\`\`bash
artillery run artillery.yml
# Quick test:
artillery quick --duration ${config.duration} --rate ${Math.floor(config.virtualUsers / config.rampUpTime)} ${config.targetUrl}
\`\`\``;
    
    case 'locust':
      return `\`\`\`bash
locust -f locustfile.py --host ${config.targetUrl}
# Headless mode:
locust -f locustfile.py --host ${config.targetUrl} --users ${config.virtualUsers} --spawn-rate ${Math.floor(config.virtualUsers / config.rampUpTime)} --run-time ${config.duration}s --headless
\`\`\``;
    
    case 'wrk':
      return `\`\`\`bash
wrk -t ${Math.min(config.virtualUsers, 12)} -c ${config.virtualUsers} -d ${config.duration}s ${config.targetUrl}
\`\`\``;
    
    case 'vegeta':
      return `\`\`\`bash
echo "GET ${config.targetUrl}" | vegeta attack -duration=${config.duration}s -rate=${config.virtualUsers}/s | vegeta report
\`\`\``;
    
    default:
      return '```bash\n# See framework documentation for run commands\n```';
  }
}

function getResultsAnalysisGuide(framework: string, reportFormat: string): string {
  let guide = `The test will generate ${reportFormat} format results. `;
  
  switch (framework) {
    case 'k6':
      guide += `k6 provides built-in metrics and can export to various systems like InfluxDB + Grafana for real-time monitoring.`;
      break;
    case 'jmeter':
      guide += `JMeter generates detailed HTML reports with graphs, statistics, and error analysis.`;
      break;
    case 'artillery':
      guide += `Artillery provides JSON reports with detailed performance metrics and can integrate with monitoring systems.`;
      break;
    case 'locust':
      guide += `Locust offers real-time web UI during tests and can export detailed CSV reports.`;
      break;
    default:
      guide += `Check the framework documentation for result analysis options.`;
  }
  
  return guide;
}

export function processLoadTestingConfigGenerator(
  targetUrl: string,
  config: LoadTestingConfig
): ToolResult {
  try {
    if (!targetUrl?.trim()) {
      return {
        success: false,
        error: 'Target URL is required'
      };
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }

    const updatedConfig = { ...config, targetUrl: targetUrl.trim() };
    let generatedConfig = '';
    let additionalFiles = '';

    switch (updatedConfig.framework) {
      case 'k6':
        generatedConfig = generateK6Config(updatedConfig);
        break;
      case 'jmeter':
        generatedConfig = generateJMeterConfig(updatedConfig);
        break;
      case 'artillery':
        generatedConfig = generateArtilleryConfig(updatedConfig);
        break;
      case 'locust':
        generatedConfig = generateLocustConfig(updatedConfig);
        break;
      case 'wrk':
        generatedConfig = `# WRK Command Line Configuration
wrk -t ${Math.min(updatedConfig.virtualUsers, 12)} -c ${updatedConfig.virtualUsers} -d ${updatedConfig.duration}s --timeout ${updatedConfig.requestTimeout}s ${updatedConfig.targetUrl}`;
        break;
      case 'vegeta':
        generatedConfig = `# Vegeta Target Configuration
GET ${updatedConfig.targetUrl}
${updatedConfig.includeHeaders ? 'Content-Type: application/json' : ''}
${updatedConfig.includeAuth && updatedConfig.authType === 'bearer' ? 'Authorization: Bearer YOUR_TOKEN_HERE' : ''}

# Run command:
# vegeta attack -targets=targets.txt -duration=${updatedConfig.duration}s -rate=${updatedConfig.virtualUsers}/s | vegeta report`;
        break;
      default:
        return {
          success: false,
          error: `Unsupported framework: ${updatedConfig.framework}`
        };
    }

    // Add Docker Compose if distributed testing is enabled
    if (updatedConfig.distributedTesting) {
      const dockerConfig = generateDockerCompose(updatedConfig);
      if (dockerConfig) {
        additionalFiles = `\n\n# Docker Compose Configuration (docker-compose.yml)
${dockerConfig}`;
      }
    }

    const guide = generateConfigurationGuide(updatedConfig);
    const result = `${generatedConfig}${additionalFiles}\n\n# Configuration Guide\n${guide}`;

    return {
      success: true,
      result,
      metadata: {
        framework: updatedConfig.framework,
        testType: updatedConfig.testType,
        virtualUsers: updatedConfig.virtualUsers,
        duration: updatedConfig.duration,
        distributedTesting: updatedConfig.distributedTesting
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate load testing configuration'
    };
  }
}

export const LOAD_TESTING_CONFIG_GENERATOR_TOOL: Tool = {
  id: 'load-testing-config-generator',
  name: 'Load Testing Configuration Generator',
  description: 'Generate comprehensive load testing configurations for popular frameworks like K6, JMeter, Artillery, Locust, and more',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'performance-tools')!,
  slug: 'load-testing-config-generator',
  icon: 'Zap',
  keywords: ['load testing', 'performance', 'k6', 'jmeter', 'artillery', 'locust', 'stress testing', 'configuration'],
  seoTitle: 'Free Load Testing Config Generator - K6, JMeter, Artillery, Locust',
  seoDescription: 'Generate load testing configurations for K6, JMeter, Artillery, Locust, and WRK. Create performance test scripts with scenarios, thresholds, and reporting.',
  tags: ['load testing', 'performance', 'k6', 'jmeter', 'artillery', 'locust', 'stress testing', 'configuration'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Generate load test configs for K6, JMeter, Artillery, Locust',
  
  examples: [
    {
      title: 'Basic K6 Load Test',
      input: 'Target: https://api.example.com\nUsers: 50, Duration: 5 minutes',
      output: 'Complete K6 JavaScript test script with scenarios, thresholds, and reporting',
      description: 'Generate a standard load test configuration for API testing'
    },
    {
      title: 'JMeter Stress Test',
      input: 'Target: https://webapp.com\nType: Stress, Users: 200, Ramp-up: 60s',
      output: 'JMeter XML test plan with thread groups, HTTP samplers, and assertions',
      description: 'Create stress testing configuration with gradual load increase'
    },
    {
      title: 'Distributed Locust Test',
      input: 'Target: https://api.service.com\nDistributed: Yes, Nodes: 3',
      output: 'Python Locust file with Docker Compose for distributed testing',
      description: 'Setup distributed load testing across multiple nodes'
    }
  ],

  useCases: [
    'Performance testing for web applications and APIs',
    'Capacity planning and infrastructure sizing',
    'Stress testing to find system breaking points',
    'Continuous integration performance testing',
    'Load testing before production deployments',
    'Benchmarking system performance improvements',
    'API reliability and resilience testing',
    'Auto-scaling configuration validation'
  ],

  faq: [
    {
      question: 'Which load testing framework should I choose?',
      answer: 'K6 is great for API testing and CI/CD integration. JMeter offers comprehensive GUI and enterprise features. Artillery excels at microservices testing. Locust is perfect for Python teams and complex user scenarios. Choose based on your team\'s expertise and testing requirements.'
    },
    {
      question: 'How do I determine the right number of virtual users?',
      answer: 'Start with your expected peak concurrent users, then test at 2x-5x that number for stress testing. Consider your system\'s capacity, network bandwidth, and testing environment limitations. Always start small and gradually increase load.'
    },
    {
      question: 'What metrics should I monitor during load testing?',
      answer: 'Key metrics include response time percentiles (P95, P99), error rate, throughput (RPS), and system resources (CPU, memory, disk I/O). Set realistic thresholds based on your SLA requirements.'
    },
    {
      question: 'How do I handle authentication in load tests?',
      answer: 'The tool generates authentication headers for Bearer tokens and API keys. For complex auth flows, you may need to customize the scripts to handle login, token refresh, and session management.'
    },
    {
      question: 'Can I use these configurations in CI/CD pipelines?',
      answer: 'Yes! Most frameworks support headless execution. K6 and Artillery integrate well with CI/CD systems. Use the generated Docker configurations for containerized testing environments.'
    }
  ],

  commonErrors: [
    'Using too many virtual users causing client-side resource exhaustion',
    'Testing against production systems without coordination',
    'Not warming up the system before actual load testing',
    'Ignoring network latency between test client and target system',
    'Misconfigured think times leading to unrealistic traffic patterns',
    'Not cleaning up test data after load testing completion'
  ],

  relatedTools: ['api-request-builder', 'performance-budget-calculator', 'webhook-testing-tool', 'api-response-formatter']
};