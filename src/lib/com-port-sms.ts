// Dynamic imports for native serialport module (only works in Node.js runtime)
let SerialPort: any;
let ReadlineParser: any;

// Lazy load serialport only when needed
async function loadSerialPort() {
  if (!SerialPort) {
    try {
      const serialport = await import('serialport');
      SerialPort = serialport.SerialPort;
      const parserReadline = await import('@serialport/parser-readline');
      ReadlineParser = parserReadline.ReadlineParser;
    } catch (error) {
      throw new Error('SerialPort library not available. Please install: npm install serialport @serialport/parser-readline');
    }
  }
  return { SerialPort, ReadlineParser };
}

export interface COMPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
}

export class COMPortSMS {
  private port: any = null;
  private parser: any = null;
  private isReady: boolean = false;
  private responseBuffer: string[] = [];
  private responseResolvers: Map<string, (value: string) => void> = new Map();

  async connect(portPath: string, baudRate: number = 9600): Promise<void> {
    const { SerialPort, ReadlineParser } = await loadSerialPort();

    return new Promise((resolve, reject) => {
      try {
        this.port = new SerialPort({
          path: portPath,
          baudRate,
          autoOpen: false,
        });

        const Parser = ReadlineParser;
        this.parser = this.port.pipe(new Parser({ delimiter: '\r\n' }));

        this.port.open((err: Error | null) => {
          if (err) {
            reject(new Error(`Failed to open port: ${err.message}`));
            return;
          }

          // Setup response handler
          this.parser?.on('data', (data: string) => {
            const trimmed = data.trim();
            if (trimmed) {
              this.responseBuffer.push(trimmed);
              
              // Check for OK/ERROR responses
              if (trimmed.includes('OK') || trimmed.includes('ERROR')) {
                // Resolve any pending command
                const commandId = this.responseBuffer[this.responseBuffer.length - 2] || 'default';
                const resolver = this.responseResolvers.get(commandId);
                if (resolver) {
                  resolver(trimmed);
                  this.responseResolvers.delete(commandId);
                }
              }
            }
          });

          // Wait a bit for module to initialize, then initialize
          setTimeout(async () => {
            try {
              await this.initialize();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, 2000);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async initialize(): Promise<void> {
    // Send AT commands to initialize GSM module
    // These are standard AT commands that work with most GSM modules
    await this.sendCommand('AT', 2000); // Test connection
    await this.delay(500);
    await this.sendCommand('AT+CMGF=1', 2000); // Set SMS text mode
    await this.delay(500);
    await this.sendCommand('AT+CNMI=2,2,0,0,0', 2000); // Set SMS notification mode
    await this.delay(500);
    this.isReady = true;
  }

  private sendCommand(command: string, timeout: number = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.port || !this.port.isOpen) {
        reject(new Error('Port is not open'));
        return;
      }

      const commandId = command;
      const timeoutId = setTimeout(() => {
        this.responseResolvers.delete(commandId);
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      const resolver = (response: string) => {
        clearTimeout(timeoutId);
        if (response.includes('ERROR')) {
          reject(new Error(`Command failed: ${command} - ${response}`));
        } else {
          resolve(response);
        }
      };

      this.responseResolvers.set(commandId, resolver);
      this.responseBuffer = [];

      this.port.write(`${command}\r\n`, (err: Error | null) => {
        if (err) {
          clearTimeout(timeoutId);
          this.responseResolvers.delete(commandId);
          reject(err);
        }
      });
    });
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.port || !this.port.isOpen) {
        throw new Error('Port is not open');
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      
      // Set recipient using AT+CMGS command
      await this.sendCommand(`AT+CMGS="${cleanNumber}"`, 5000);
      await this.delay(1000);

      // Send message with Ctrl+Z (0x1A) to indicate end
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SMS send timeout'));
        }, 30000);

        const handler = (data: string) => {
          const trimmed = data.trim();
          if (trimmed.includes('+CMGS:') || trimmed === 'OK') {
            clearTimeout(timeout);
            this.parser?.removeListener('data', handler);
            resolve(true);
          } else if (trimmed.includes('ERROR')) {
            clearTimeout(timeout);
            this.parser?.removeListener('data', handler);
            reject(new Error('SMS send failed: ' + trimmed));
          }
        };

        this.parser?.on('data', handler);
        
        // Send message followed by Ctrl+Z (0x1A) to indicate end
        this.port.write(`${message}\x1A`, (err: Error | null) => {
          if (err) {
            clearTimeout(timeout);
            this.parser?.removeListener('data', handler);
            reject(err);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.port && this.port.isOpen) {
        this.port.close((err: Error | null) => {
          if (err) console.error('Error closing port:', err);
          this.port = null;
          this.parser = null;
          this.isReady = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async listPorts(): Promise<COMPort[]> {
    try {
      const { SerialPort } = await loadSerialPort();
      const ports = await SerialPort.list();
      return ports.map((port: any) => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
      }));
    } catch (error) {
      console.error('Error listing ports:', error);
      return [];
    }
  }
}

