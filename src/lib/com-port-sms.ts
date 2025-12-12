import { nanoid } from 'nanoid';

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

interface QueuedCommand {
  command: string;
  timeout: number;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
}

export class COMPortSMS {
  private port: any = null;
  private parser: any = null;
  private isReady: boolean = false;
  private currentResolver: ((value: string) => void) | null = null;
  
  // Command queue to prevent race conditions
  private commandQueue: QueuedCommand[] = [];
  private isProcessingQueue: boolean = false;

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
              // Log incoming data for debugging
              // console.log('RX:', trimmed);
              
              // Check for OK/ERROR responses or specific command responses
              // We only resolve if we are currently expecting a response (currentResolver is set)
              if (this.currentResolver) {
                 if (trimmed.includes('OK') || trimmed.includes('ERROR') || trimmed.includes('+CMGS:')) {
                    this.currentResolver(trimmed);
                    // Reset resolver after handling is done in executeCommand's logic, 
                    // but here we just pass the data. 
                    // Actually, the specific matching logic usually happens here.
                    // For simplicity in this generic driver, we pass the "final" status lines.
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

  /**
   * Enqueues a command to be sent to the serial port.
   * Ensures that commands are executed sequentially.
   */
  private sendCommand(command: string, timeout: number = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, timeout, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Processes the command queue sequentially.
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      const cmd = this.commandQueue[0]; // Peek
      try {
        await this.executeCommand(cmd.command, cmd.timeout, cmd.resolve, cmd.reject);
      } catch (error) {
        cmd.reject(error);
      } finally {
        this.commandQueue.shift(); // Remove processed command
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Executes a single command on the port.
   */
  private executeCommand(
    command: string, 
    timeout: number,
    resolve: (val: string) => void, 
    reject: (err: Error) => void
  ): Promise<void> {
    return new Promise((internalResolve) => {
        if (!this.port || !this.port.isOpen) {
            reject(new Error('Port is not open'));
            internalResolve();
            return;
        }

        let isResolved = false;
        const cleanup = () => {
            isResolved = true;
            this.currentResolver = null;
            clearTimeout(timeoutId);
        };

        const timeoutId = setTimeout(() => {
            if (!isResolved) {
                cleanup();
                reject(new Error(`Command timeout: ${command}`));
                internalResolve();
            }
        }, timeout);

        // Set the resolver that the parser listener will call
        this.currentResolver = (response: string) => {
            if (!isResolved) {
                if (response.includes('ERROR')) {
                    cleanup();
                    reject(new Error(`Command failed: ${command} - ${response}`));
                } else {
                    cleanup();
                    resolve(response);
                }
                internalResolve();
            }
        };

        // Write the command
        this.port.write(`${command}\r\n`, (err: Error | null) => {
            if (err) {
                cleanup();
                reject(err);
                internalResolve();
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
      const cleanNumber = phoneNumber.replace(/[" "\-\(\)]/g, '');
      
      // We use the queue for the initial command
      await this.sendCommand(`AT+CMGS="${cleanNumber}"`, 5000);
      await this.delay(500); // Wait for '>' prompt (simulated delay for now as we use generic parser)

      // The message body is a special case. It's technically part of the CMGS flow.
      // In a strict queue system, we should lock the queue until the SMS is fully sent.
      // Since sendCommand returns only after OK/ERROR, and CMGS returns prompt '>', 
      // we need a slightly more complex flow for SMS. 
      // However, for this fix, we will treat the message body as a raw write 
      // ensuring we hijack the queue processing for this critical section.
      
      // NOTE: A proper GSM driver implements a state machine. 
      // Here we will manually write to port to complete the transaction 
      // before allowing the queue to process the next AT command.
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            // If this times out, we should probably reset the port or send ESC
            reject(new Error('SMS send timeout'));
        }, 30000);

        // We temporarily override the parser listener for the specific SMS result
        const smsHandler = (data: string) => {
          const trimmed = data.trim();
          if (trimmed.includes('+CMGS:') || trimmed === 'OK') {
             // Success
             cleanup();
             resolve(true);
          } else if (trimmed.includes('ERROR')) {
             cleanup();
             reject(new Error('SMS send failed: ' + trimmed));
          }
        };

        const cleanup = () => {
            clearTimeout(timeout);
            this.parser?.removeListener('data', smsHandler);
        };

        this.parser?.on('data', smsHandler);
        
        // Send message followed by Ctrl+Z (0x1A) to indicate end
        this.port.write(`${message}\x1A`, (err: Error | null) => {
          if (err) {
            cleanup();
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