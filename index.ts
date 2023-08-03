import * as fs from 'fs';
import * as readline from 'readline-sync';

// Interface for log entry
interface LogEntry {
  timestamp: number;
  endpoint?: string;
  statusCode?: number;
}

// Function to read log data and split it into time series data
function readLogData(filePath: string): LogEntry[] {
  const data: LogEntry[] = [];
  const logFile = fs.readFileSync(filePath, 'utf-8');
  const logLines = logFile.split('\n');

  const logPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2} \+\d{2}:\d{2}): .*? (?:\[(\d+)\] )?"(.*?) (.*?) .*?" (\d{3}) .*?/;

  logLines.forEach((line) => {
    const match = logPattern.exec(line);
    if (match) {
      const [, timestampStr, , method, endpoint, protocol, statusCodeStr] = match;
      const timestamp = Date.parse(timestampStr);
      const statusCode = statusCodeStr ? parseInt(statusCodeStr) : undefined;

      data.push({ timestamp, endpoint: `${method} ${endpoint}`, statusCode: parseInt(protocol) });
    }
  });

  return data;
}



// Function to count the number of API calls for each endpoint
function countEndpointCalls(logData: LogEntry[]): Map<string, number> {
  const endpointCount: Map<string, number> = new Map();

  logData.forEach((log) => {
    const { endpoint } = log;
    if (endpoint) {
      endpointCount.set(endpoint, (endpointCount.get(endpoint) || 0) + 1);
    }
  });

  return endpointCount;
}

// Function to count API calls per minute
function countAPICallsPerMinute(logData: LogEntry[]): Map<string, number> {
  const callsPerMinute: Map<string, number> = new Map();

  logData.forEach((log) => {
    const date = new Date(log.timestamp);
    const minute = `${date.getHours()}:${date.getMinutes()}`;
    callsPerMinute.set(minute, (callsPerMinute.get(minute) || 0) + 1);
  });

  return callsPerMinute;
}

// Function to count API calls per status code
function countAPICallsByStatusCode(logData: LogEntry[]): Map<number, number> {
  const callsByStatusCode: Map<number, number> = new Map();

  logData.forEach((log) => {
    const { statusCode } = log;
    if (statusCode) {
      callsByStatusCode.set(statusCode, (callsByStatusCode.get(statusCode) || 0) + 1);
    }
  });

  return callsByStatusCode;
}

// Function to display the data in a formatted table
function displayDataInTable(data: Map<any, any>, title: string) {
  console.log(`\n${title}`);
  if (data.size > 0) {
    const dataArray = Array.from(data, ([index, count]) => ({ index, count }));
    console.table(dataArray);
  } else {
    console.log('No data found.');
  }
}



// Main function
function main() {
  try {
    const logFilePath = readline.question('Enter the path to the log file: ');

    // Read and parse log data
    const logData = readLogData(logFilePath).slice(0, 20);

    // Get the number of times each endpoint is called
    const endpointCalls = countEndpointCalls(logData);
    displayDataInTable(endpointCalls, 'Endpoint Calls');

    // Get the number of API calls per minute
    const apiCallsPerMinute = countAPICallsPerMinute(logData);
    displayDataInTable(apiCallsPerMinute, 'API Calls Per Minute');

    // Get the total API calls for each HTTP status code
    const apiCallsByStatusCode = countAPICallsByStatusCode(logData);
    displayDataInTable(apiCallsByStatusCode, 'API Calls Per Status Code');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main();
