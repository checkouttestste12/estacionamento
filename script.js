// Configurações de preços
const PRECOS = {
    'guarulhos-descoberto': {
        diaria: 25.00,
        nome: 'Guarulhos (GRU) - Descoberto'
    },
    'guarulhos-coberto': {
        diaria: 35.00,
        nome: 'Guarulhos (GRU) - Coberto'
    }
};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupFormValidation();
    setupDateValidation();
    setupPhoneMask();
    setupPlateMask();
});

// Inicializar formulário
function initializeForm() {
    const form = document.getElementById('form-reserva');
    form.addEventListener('submit', handleFormSubmit);
    
    // Definir data mínima como hoje
    const hoje = new Date();
    const dataMinima = hoje.toISOString().slice(0, 16);
    document.getElementById('entrada').min = dataMinima;
    document.getElementById('saida').min = dataMinima;
}

// Configurar validação do formulário
function setupFormValidation() {
    const campos = ['nome', 'email', 'telefone', 'veiculo', 'placa', 'comodidade', 'entrada', 'saida'];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('blur', () => validateField(campo));
            elemento.addEventListener('input', () => clearFieldError(campo));
        }
    });
}

// Configurar validação de datas
function setupDateValidation() {
    const entrada = document.getElementById('entrada');
    const saida = document.getElementById('saida');
    
    entrada.addEventListener('change', function() {
        if (this.value) {
            saida.min = this.value;
            if (saida.value && saida.value <= this.value) {
                saida.value = '';
            }
        }
    });
}

// Máscara para telefone
function setupPhoneMask() {
    const telefone = document.getElementById('telefone');
    telefone.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            if (value.length < 14) {
                value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }
        e.target.value = value;
    });
}

// Máscara para placa
function setupPlateMask() {
    const placa = document.getElementById('placa');
    placa.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (value.length <= 7) {
            if (value.length > 3) {
                value = value.replace(/([A-Z]{3})([0-9A-Z])/, '$1-$2');
            }
        }
        e.target.value = value;
    });
}

// Validar campo individual
function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
        case 'nome':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Nome deve ter pelo menos 2 caracteres';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'E-mail inválido';
            }
            break;
        case 'telefone':
            const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Telefone inválido';
            }
            break;
        case 'placa':
            const plateRegex = /^[A-Z]{3}-[0-9A-Z]{4}$/;
            if (!plateRegex.test(value)) {
                isValid = false;
                errorMessage = 'Placa inválida (formato: ABC-1234)';
            }
            break;
        case 'entrada':
        case 'saida':
            if (!value) {
                isValid = false;
                errorMessage = 'Data e hora são obrigatórias';
            }
            break;
    }

    showFieldError(fieldName, isValid, errorMessage);
    return isValid;
}

// Mostrar erro no campo
function showFieldError(fieldName, isValid, errorMessage) {
    const field = document.getElementById(fieldName);
    const formGroup = field.closest('.form-group');
    
    // Remove erro anterior
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    if (!isValid) {
        field.style.borderColor = '#e74c3c';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = errorMessage;
        formGroup.appendChild(errorDiv);
    } else {
        field.style.borderColor = '#27ae60';
    }
}

// Limpar erro do campo
function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const formGroup = field.closest('.form-group');
    const existingError = formGroup.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '#e1e5e9';
}

// Manipular envio do formulário
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validar todos os campos
    const campos = ['nome', 'email', 'telefone', 'veiculo', 'placa', 'comodidade', 'entrada', 'saida'];
    let formValido = true;
    
    campos.forEach(campo => {
        if (!validateField(campo)) {
            formValido = false;
        }
    });
    
    // Validar datas
    const entrada = new Date(document.getElementById('entrada').value);
    const saida = new Date(document.getElementById('saida').value);
    
    if (saida <= entrada) {
        showFieldError('saida', false, 'Data de saída deve ser posterior à entrada');
        formValido = false;
    }
    
    if (formValido) {
        calcularReserva();
    } else {
        mostrarNotificacao('Por favor, corrija os erros no formulário', 'error');
    }
}

// Calcular valor da reserva
function calcularReserva() {
    const entrada = new Date(document.getElementById('entrada').value);
    const saida = new Date(document.getElementById('saida').value);
    const comodidade = document.getElementById('comodidade').value;
    
    // Calcular número de dias
    const diffTime = Math.abs(saida - entrada);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular preço
    const precoConfig = PRECOS[comodidade];
    const valorDiaria = precoConfig.diaria;
    const valorTotal = valorDiaria * diffDays;
    
    // Aplicar desconto para estadias longas
    let desconto = 0;
    if (diffDays >= 7) {
        desconto = 0.15; // 15% de desconto
    } else if (diffDays >= 3) {
        desconto = 0.10; // 10% de desconto
    }
    
    const valorDesconto = valorTotal * desconto;
    const valorFinal = valorTotal - valorDesconto;
    
    // Mostrar resultado
    mostrarResultado({
        nome: document.getElementById('nome').value,
        veiculo: document.getElementById('veiculo').value,
        placa: document.getElementById('placa').value,
        comodidade: precoConfig.nome,
        entrada: formatarData(entrada),
        saida: formatarData(saida),
        dias: diffDays,
        valorDiaria: valorDiaria,
        valorTotal: valorTotal,
        desconto: valorDesconto,
        valorFinal: valorFinal
    });
}

// Mostrar resultado da reserva
function mostrarResultado(dados) {
    const resumoDiv = document.getElementById('resumo-detalhes');
    const valorTotalDiv = document.getElementById('valor-total');
    
    resumoDiv.innerHTML = `
        <p><strong>Cliente:</strong> ${dados.nome}</p>
        <p><strong>Veículo:</strong> ${dados.veiculo} (${dados.placa})</p>
        <p><strong>Tipo de Vaga:</strong> ${dados.comodidade}</p>
        <p><strong>Entrada:</strong> ${dados.entrada}</p>
        <p><strong>Saída:</strong> ${dados.saida}</p>
        <p><strong>Período:</strong> ${dados.dias} dia(s)</p>
        <p><strong>Valor da Diária:</strong> R$ ${dados.valorDiaria.toFixed(2)}</p>
        ${dados.desconto > 0 ? `<p><strong>Desconto:</strong> R$ ${dados.desconto.toFixed(2)}</p>` : ''}
    `;
    
    valorTotalDiv.innerHTML = `Total: R$ ${dados.valorFinal.toFixed(2)}`;
    
    document.getElementById('resultado').style.display = 'block';
    document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
    
    mostrarNotificacao('Cálculo realizado com sucesso!', 'success');
}

// Confirmar reserva
function confirmarReserva() {
    mostrarNotificacao('Reserva confirmada! Entraremos em contato em breve.', 'success');
    
    // Simular envio de dados
    setTimeout(() => {
        document.getElementById('form-reserva').reset();
        document.getElementById('resultado').style.display = 'none';
        mostrarNotificacao('Dados enviados com sucesso! Você receberá um e-mail de confirmação.', 'info');
    }, 2000);
}

// Formatar data para exibição
function formatarData(data) {
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Definir cor baseada no tipo
    switch (tipo) {
        case 'success':
            notificacao.style.background = '#27ae60';
            break;
        case 'error':
            notificacao.style.background = '#e74c3c';
            break;
        case 'info':
        default:
            notificacao.style.background = '#3498db';
            break;
    }
    
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);
    
    // Animar entrada
    setTimeout(() => {
        notificacao.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notificacao.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.remove();
            }
        }, 300);
    }, 5000);
}

// Navegação suave para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

