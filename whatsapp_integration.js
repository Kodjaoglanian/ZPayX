const { Client, LocalAuth } = require('whatsapp-web.js');
const { Blockchain } = require('./wallet_blockchain');
const qrcode = require('qrcode-terminal');

const client = new Client({ authStrategy: new LocalAuth() });
const blockchain = new Blockchain();

// Lista de números de telefone de administradores
const ADMIN_NUMBERS = ['556784229414']; // Adicione os números de telefone dos administradores aqui

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QRCode gerado, escaneie com o WhatsApp.');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp está pronto!');
});

client.on('message', async (message) => {
    const chat = await message.getChat();
    const from = message.from.replace('@c.us', '');

    console.log(`Recebido: ${message.body} de ${from}`);

    if (message.body.startsWith('!')) {
        const command = message.body.slice(1).split(' ');

        switch (command[0]) {
            case 'ajuda':
                chat.sendMessage(`🆘 Comandos disponíveis:\n
                !criar_conta - Cria uma nova conta para você.\n
                !meu_endereco - Mostra seu endereço.\n
                !saldo - Exibe seu saldo atual.\n
                !adicionar_saldo [número] [valor] - Adiciona saldo a uma conta (apenas administradores).\n
                !transferir [número] [valor] - Transfere dinheiro para outro número.`); // Histórico removido
                break;
            case 'criar_conta':
                const response = blockchain.createAccount(from);
                chat.sendMessage(response);
                break;
            case 'meu_endereco':
                const account = blockchain.pendingTransactions.find(t => t.fromAddress === from);
                if (account) {
                    chat.sendMessage(`🏦 Seu endereço é: *${from}*`);
                } else {
                    chat.sendMessage('⚠️ Você precisa criar uma conta primeiro usando *!criar_conta*.');
                }
                break;
            case 'saldo':
                const balance = blockchain.getBalance(from);
                chat.sendMessage(`💰 Seu saldo é: R$${balance.toFixed(2)}`);
                break;
            case 'adicionar_saldo':
                if (!ADMIN_NUMBERS.includes(from)) {
                    chat.sendMessage('⚠️ Você não tem permissão para adicionar saldo.');
                    return;
                }

                if (command[1] && command[2]) {
                    const userPhone = command[1];
                    const amount = parseFloat(command[2]);

                    if (isNaN(amount) || amount <= 0) {
                        chat.sendMessage('⚠️ O valor deve ser um número positivo.');
                    } else {
                        const result = blockchain.addFunds(from, userPhone, amount);
                        chat.sendMessage(result);
                    }
                } else {
                    chat.sendMessage('⚠️ Uso correto: !adicionar_saldo [número] [valor]');
                }
                break;
            case 'transferir':
                if (command[1] && command[2]) {
                    const toPhone = command[1];
                    const amount = parseFloat(command[2]);

                    if (isNaN(amount) || amount <= 0) {
                        chat.sendMessage('⚠️ O valor deve ser um número positivo.');
                    } else {
                        const transferResult = blockchain.transferFunds(from, toPhone, amount);

                        if (transferResult.success) {
                            chat.sendMessage(`✅ Transferência de R$${amount} para ${toPhone} realizada com sucesso!`);
                        } else {
                            chat.sendMessage(`⚠️ Erro: ${transferResult.message}`);
                        }
                    }
                } else {
                    chat.sendMessage('⚠️ Uso correto: !transferir [número] [valor]');
                }
                break;
            default:
                chat.sendMessage('⚠️ Comando não reconhecido. Use *!ajuda* para ver a lista de comandos.');
        }
    }
});

client.initialize();
