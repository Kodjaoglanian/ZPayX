import streamlit as st
import json
import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
import datetime
import os  # Importando os para executar o script do bot

# Variável para controlar o estado do bot
bot_ativo = False

# Função para carregar o conteúdo do arquivo database.json
def carregar_database():
    try:
        with open('database.json', 'r') as file:
            data = json.load(file)
        return data
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

# Função para exibir as transações na tabela
def exibir_transacoes():
    database = carregar_database()
    if not database:
        st.write("Nenhuma transação encontrada.")
        return
    
    chain = database.get('chain', [])
    transacoes = []
    for block in chain:
        block_transactions = block.get('transactions', [])
        transacoes.extend(block_transactions)

    if transacoes:
        df = pd.DataFrame(transacoes)
        st.dataframe(df)  # Removido o estilo
    else:
        st.write("Nenhuma transação disponível.")

# Função para exibir os saldos pendentes
def exibir_saldos_pendentes():
    database = carregar_database()
    if not database:
        st.write("Nenhum saldo pendente encontrado.")
        return
    
    pending_transactions = database.get('pendingTransactions', [])
    if pending_transactions:
        df = pd.DataFrame(pending_transactions)
        st.dataframe(df)  # Removido o estilo
    else:
        st.write("Nenhum saldo pendente disponível.")

# Função para exibir os logs da blockchain
def exibir_logs():
    database = carregar_database()
    if not database:
        st.write("Nenhum log encontrado.")
        return
    
    chain = database.get('chain', [])
    logs = []
    for block in chain:
        timestamp = datetime.datetime.fromtimestamp(block['timestamp'] / 1000).strftime('%Y-%m-%d %H:%M:%S')
        logs.append(f"Timestamp: {timestamp}, Hash: {block['hash']}, Previous Hash: {block['previousHash']}")
    
    if logs:
        st.write("Logs da Blockchain:")
        for log in logs:
            st.write(log)
    else:
        st.write("Nenhum log disponível.")

# Função para verificar se o bot está ativo
def verificar_status_bot():
    if bot_ativo:
        st.write("Bot WhatsApp: Ativo")
    else:
        st.write("Bot WhatsApp: Inativo")

# Função para iniciar o bot
def iniciar_bot():
    global bot_ativo
    bot_ativo = True
    verificar_status_bot()
    try:
        # Inicia o script do bot em segundo plano
        os.system('node whatsapp_integration.js &')
    except Exception as e:
        st.error(f"Erro ao iniciar o bot: {e}")

# Função para verificar fraudes usando Isolation Forest
def verificar_fraudes(transacoes):
    if not transacoes:
        st.write("Nenhuma transação disponível para verificar fraudes.")
        return

    valores = np.array([transacao['amount'] for transacao in transacoes]).reshape(-1, 1)
    modelo = IsolationForest(contamination=0.1)
    modelo.fit(valores)
    preds = modelo.predict(valores)

    df = pd.DataFrame({
        'De': [transacao['fromAddress'] for transacao in transacoes],
        'Para': [transacao['toAddress'] for transacao in transacoes],
        'Valor': [transacao['amount'] for transacao in transacoes],
        'Motivo': ['Transação suspeita devido ao valor alto.' if pred == -1 else 'Transação normal' for pred in preds]
    })

    st.dataframe(df)  # Removido o estilo

# Função para criar a página de login
def criar_pagina_login():
    st.title("Login")

    usuario = st.text_input("Usuário")
    senha = st.text_input("Senha", type="password")

    if st.button("Login"):
        if usuario == "admin" and senha == "senha123":
            st.session_state.logado = True

# Função para criar a página principal
def criar_pagina_principal():
    st.title("Blockchain Database")

    menu = st.sidebar.selectbox("Menu", ["Transações", "Saldos Pendentes", "Bot WhatsApp", "Fraudes", "Logs"])

    if menu == "Transações":
        exibir_transacoes()
    elif menu == "Saldos Pendentes":
        exibir_saldos_pendentes()
    elif menu == "Bot WhatsApp":
        verificar_status_bot()
        if st.button("Iniciar Bot"):
            iniciar_bot()
    elif menu == "Fraudes":
        transacoes = [transacao for block in carregar_database().get('chain', []) for transacao in block.get('transactions', [])]
        verificar_fraudes(transacoes)
    elif menu == "Logs":
        exibir_logs()

# Verifica se o usuário está logado
if 'logado' not in st.session_state:
    criar_pagina_login()
else:
    if st.session_state.logado:
        criar_pagina_principal()
