const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

class Transaction {
    constructor(fromAddress, toAddress, amount, type) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.type = type; // "add" para adicionar fundos, "transfer" para transferências
        this.timestamp = new Date();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(JSON.stringify(this)).digest('hex');
    }
}

class Block {
    constructor(previousHash) {
        this.previousHash = previousHash;
        this.transactions = [];
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(JSON.stringify(this.transactions) + this.previousHash + this.timestamp).digest('hex');
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.loadDatabase();
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return { valid: false, message: `Bloco ${i} foi alterado!` };
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return { valid: false, message: `Bloco ${i - 1} foi alterado!` };
            }
        }
        return { valid: true, message: 'Blockchain está íntegra.' };
    }

    validateBlockchain() {
        const validationResult = this.isChainValid();
        if (!validationResult.valid) {
            console.log(`⚠️ Falha na integridade da blockchain: ${validationResult.message}`);
            return false;
        }
        return true;
    }

    addTransaction(transaction) {
        if (!this.validateBlockchain()) {
            return { success: false, message: 'A blockchain foi corrompida e não pode processar transações.' };
        }

        const fromAccount = this.pendingTransactions.find(t => t.fromAddress === transaction.fromAddress);
        const toAccount = this.pendingTransactions.find(t => t.fromAddress === transaction.toAddress);

        if (!this.isValidPhone(transaction.fromAddress) || !this.isValidPhone(transaction.toAddress)) {
            return { success: false, message: 'Formato de telefone inválido.' };
        }

        if (!fromAccount || fromAccount.balance < transaction.amount) {
            return { success: false, message: 'Saldo insuficiente.' };
        }

        fromAccount.balance -= transaction.amount;
        toAccount.balance += transaction.amount;

        const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '0';
        const newBlock = new Block(previousHash);
        newBlock.addTransaction(transaction);
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);

        this.saveDatabase();

        return { success: true, message: 'Transação realizada com sucesso!', hash: newBlock.hash };
    }

    addFunds(adminPhone, phone, amount) {
        const account = this.pendingTransactions.find(t => t.fromAddress === phone);
        if (account) {
            account.balance += amount;
            const transaction = new Transaction(adminPhone, phone, amount, 'add');
            this.saveDatabase();
            return `Saldo de ${phone} aumentado em R$${amount.toFixed(2)}.`;
        }
        return 'Conta não encontrada.';
    }

    transferFunds(fromPhone, toPhone, amount) {
        const fromAccount = this.pendingTransactions.find(t => t.fromAddress === fromPhone);
        const toAccount = this.pendingTransactions.find(t => t.fromAddress === toPhone);

        if (!fromAccount || !toAccount) {
            return { success: false, message: 'Uma das contas não existe.' };
        }

        const transaction = new Transaction(fromPhone, toPhone, amount, 'transfer');
        const result = this.addTransaction(transaction);

        return result;
    }

    getBalance(phone) {
        const account = this.pendingTransactions.find(t => t.fromAddress === phone);
        return account ? account.balance : 0;
    }

    isValidPhone(phone) {
        const phoneRegex = /^\+?\d{1,3}[-\s]?\(?\d{2,3}\)?[-\s]?\d{4,5}[-\s]?\d{4}$/; // Aceita vários formatos
        return phoneRegex.test(phone);
    }

    loadDatabase() {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            if (data.trim().length === 0) {
                console.log('Arquivo de banco de dados está vazio. Inicializando...');
                this.chain.push(new Block('0'));  // Cria o bloco gênesis
                this.saveDatabase();
            } else {
                const db = JSON.parse(data);
                this.chain = db.chain.map(blockData => {
                    const block = new Block(blockData.previousHash);
                    block.transactions = blockData.transactions;
                    block.timestamp = blockData.timestamp;
                    block.hash = blockData.hash;
                    return block;
                });
                this.pendingTransactions = db.pendingTransactions || [];
            }
        } else {
            console.log('Arquivo de banco de dados não encontrado. Inicializando...');
            this.chain.push(new Block('0'));  // Cria o bloco gênesis
            this.saveDatabase();
        }
    }

    saveDatabase() {
        const db = {
            chain: this.chain,
            pendingTransactions: this.pendingTransactions,
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }

    createAccount(fromAddress) {
        const existingAccount = this.pendingTransactions.find(t => t.fromAddress === fromAddress);
        if (existingAccount) {
            return '⚠️ Conta já existe.';
        }

        const newAccount = {
            fromAddress: fromAddress,
            balance: 0
        };

        this.pendingTransactions.push(newAccount);
        this.saveDatabase();

        return `✅ Conta criada com sucesso para ${fromAddress}.`;
    }
}

module.exports = { Blockchain };
