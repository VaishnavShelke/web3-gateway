const { ethers } = require("ethers");
const { sendTokenTransferEvent } = require("../handlers/sendTokenTransferEvent");
require('dotenv').config();

class ContractEventScanner {
    constructor(contract, provider) {
        this.contract = contract;
        this.provider = provider;
        this.isScanning = false;
        this.scanInterval = null;
        this.lastScannedBlock = null;
        this.errorCount = 0;
        this.lastError = null;
    }

    async startScanning() {
        if (this.isScanning) {
            console.log('Event scanner is already running');
            return;
        }

        try {
            // Get the current block number to start scanning from
            this.lastScannedBlock = await this.provider.getBlockNumber();
            console.log(`Starting event scanner from block ${this.lastScannedBlock}`);

            this.isScanning = true;
            this.scanInterval = setInterval(() => this.scanEvents(), 10000); // Run every 10 seconds
            console.log('Event scanner started successfully');
        } catch (error) {
            console.error('Error starting event scanner:', error);
            this.isScanning = false;
            this.lastError = error;
            this.errorCount++;
        }
    }

    async stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        this.isScanning = false;
        console.log('Event scanner stopped');
    }

    async scanEvents() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            
            if (currentBlock <= this.lastScannedBlock) {
                console.log('No new blocks to scan');
                return;
            }

            console.log(`Scanning blocks from ${this.lastScannedBlock + 1} to ${currentBlock}`);

            // Get all events from the contract
            const events = await this.contract.queryFilter({}, this.lastScannedBlock + 1, currentBlock);
            
            if (events.length > 0) {
                console.log(`Found ${events.length} events:`);
                events.forEach((event, index) => {
                    console.log(`\nEvent ${index + 1}:`);
                    
                    // Get the event signature from the first topic
                    const eventSignature = event.topics[0];
                    console.log('- Event Signature:', eventSignature);

                    // Find the event fragment that matches this signature
                    const eventFragment = this.contract.interface.getEvent(eventSignature);
                    console.log('- Event Fragment:', eventFragment ? eventFragment.name : 'Unknown');

                    // Log raw event data for debugging
                    console.log('- Raw Event Data:', {
                        topics: event.topics,
                        data: event.data,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        logIndex: event.logIndex
                    });

                    if (eventFragment) {
                        try {
                            // For Transfer event, the parameters are in this order:
                            // topics[1] = operator address
                            // topics[2] = from address
                            // topics[3] = to address
                            const operator = ethers.utils.getAddress(event.topics[1].slice(26));
                            const from = ethers.utils.getAddress(event.topics[2].slice(26));
                            const to = ethers.utils.getAddress(event.topics[3].slice(26));

                            // Decode the data field which contains:
                            // - id (uint256)
                            // - amount (uint256)
                            // - data (bytes)
                            const data = event.data;
                            const id = ethers.BigNumber.from(ethers.utils.hexDataSlice(data, 0, 32)).toString();
                            const amount = ethers.BigNumber.from(ethers.utils.hexDataSlice(data, 32, 64)).toString();
                            
                            // Get the data bytes
                            const dataOffset = ethers.BigNumber.from(ethers.utils.hexDataSlice(data, 64, 96)).toNumber();
                            const dataLength = ethers.BigNumber.from(ethers.utils.hexDataSlice(data, 96, 128)).toNumber();
                            const eventData = ethers.utils.hexDataSlice(data, 128, 128 + dataLength * 2);
                            
                            // Step 1: Convert hex string to BigInt
                            const bigIntValue = BigInt(eventData);
                            // Step 2: Convert to decimal string
                            const decimalString = bigIntValue.toString();
                            // Step 3: Extract the first 17 digits (actual timestamp-like value)
                            const timestampValue = decimalString.slice(0, 17);

                            const info = {
                                operator: operator,
                                from: from,
                                to: to,
                                id: id,
                                value: amount,
                                data: timestampValue,
                                event: event
                            };
                            console.log('Sending Transfer event to sendTokenTransferEvent:', info);
                            sendTokenTransferEvent(info);
                        } catch (decodeError) {
                            console.error('Error decoding event:', decodeError);
                            console.log('Event Fragment:', eventFragment);
                            console.log('Raw Event Data:', {
                                topics: event.topics,
                                data: event.data
                            });
                            this.lastError = decodeError;
                            this.errorCount++;
                        }
                    } else {
                        console.log('- Could not find matching event fragment for signature:', eventSignature);
                        console.log('- Available events in contract:', Object.keys(this.contract.interface.events));
                    }
                });
            } else {
                console.log('No events found in scanned blocks');
            }

            this.lastScannedBlock = currentBlock;
        } catch (error) {
            console.error('Error scanning events:', error);
            console.error('Error details:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            this.lastError = error;
            this.errorCount++;
        }
    }

    isRunning() {
        return this.isScanning;
    }

    getLastScannedBlock() {
        return this.lastScannedBlock;
    }

    getContractAddress() {
        return this.contract ? this.contract.address : null;
    }

    isContractInitialized() {
        return this.contract !== null && this.contract !== undefined;
    }

    getStatus() {
        return {
            isRunning: this.isScanning,
            lastScannedBlock: this.lastScannedBlock,
            contractAddress: this.getContractAddress(),
            isContractInitialized: this.isContractInitialized(),
            errorCount: this.errorCount,
            lastError: this.lastError ? this.lastError.message : null
        };
    }
}

module.exports = ContractEventScanner; 