# ZPayX - Blockchain e WhatsApp Integration

Este projeto integra uma blockchain personalizada com um sistema de monitoramento de transações e um bot de WhatsApp para automação de interações. Ele inclui uma interface visual em **Streamlit**, onde os administradores podem gerenciar transações, verificar logs e monitorar atividades suspeitas.

## Funcionalidades
- **Monitoramento de Transações**: Exibe todas as transações registradas na blockchain.
- **Saldos Pendentes**: Mostra transações pendentes na rede.
- **Logs da Blockchain**: Apresenta os registros completos dos blocos gerados.
- **Bot de WhatsApp**: Possibilita a ativação de um bot para automatizar notificações via WhatsApp.
- **Detecção de Fraudes**: Analisa as transações em tempo real utilizando Isolation Forest.

## Estrutura de Dados
- `database.json`: Contém o histórico da blockchain com os blocos e transações.

## Tecnologias
- **Python**
- **Streamlit**
- **Node.js** para o bot do WhatsApp
- **Isolation Forest** para detecção de fraudes

## Como Iniciar o Projeto
1. Clone o repositório.
2. Instale as dependências listadas no arquivo de requisitos.
3. Execute a aplicação Streamlit.
4. Ative o bot de WhatsApp a partir da interface.

