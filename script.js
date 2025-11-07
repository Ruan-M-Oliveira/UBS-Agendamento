// VARIÁVEIS DE PERSISTÊNCIA (JSON no LocalStorage)
const STORAGE_KEY_USERS = 'ubs_users';
const STORAGE_KEY_APPOINTMENTS = 'ubs_appointments';
let loggedUserEmail = localStorage.getItem('loggedUserEmail') || null;

// REFERÊNCIAS DO DOM (Gerais)
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const profileIcon = document.getElementById('profile-icon');
const navAgendar = document.getElementById('nav-agendar');
const navConsultas = document.getElementById('nav-consultas');

// Referências para o CRUD (Usado apenas no index.html)
const contentArea = document.getElementById('content-area');
const agendamentoForm = document.getElementById('agendamento-form');
const dataInput = document.getElementById('data');
const horaInput = document.getElementById('hora');
const especialidadeInput = document.getElementById('especialidade');
const consultaIdInput = document.getElementById('consulta-id');
const tabelaBody = document.querySelector('#consultas-tabela tbody');
const formButton = document.getElementById('form-button');
const cancelarEdicaoButton = document.getElementById('cancelar-edicao');
const noConsultasDiv = document.getElementById('no-consultas');


// FUNÇÕES DE PERSISTÊNCIA (JSON no LocalStorage)
function loadUsers() {
    const usersJSON = localStorage.getItem(STORAGE_KEY_USERS);
    return usersJSON ? JSON.parse(usersJSON) : [];
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function loadAppointments() {
    const appointmentsJSON = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    return appointmentsJSON ? JSON.parse(appointmentsJSON) : [];
}

function saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
}


// FUNÇÕES DE AUTENTICAÇÃO E CONTROLE DE UI
function checkAuthStatus() {
    if (loggedUserEmail) {
        // Logado
        if (userDisplay) userDisplay.textContent = `Olá, ${loggedUserEmail.split('@')[0]}!`;
        if (userDisplay) userDisplay.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (profileIcon) profileIcon.style.display = 'none';
        
        if (navAgendar) navAgendar.style.display = 'list-item';
        if (navConsultas) navConsultas.style.display = 'list-item';

        if (contentArea) {
            contentArea.style.display = 'block';
            renderizarConsultas();
        }
    } else {
        // Deslogado
        if (userDisplay) userDisplay.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileIcon) profileIcon.style.display = 'block';

        if (navAgendar) navAgendar.style.display = 'none';
        if (navConsultas) navConsultas.style.display = 'none';
        if (contentArea) contentArea.style.display = 'none';
    }
}

// LOGOUT
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Deseja realmente sair?')) {
            loggedUserEmail = null;
            localStorage.removeItem('loggedUserEmail');
            window.location.href = 'index.html'; 
        }
    });
}


// FUNÇÃO DE SETUP PARA PÁGINAS DE LOGIN/REGISTRO
function setupAuthListeners(pageType) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMsg = document.getElementById('login-msg');
    const registerMsg = document.getElementById('register-msg');
    const registerConfirmSenhaInput = document.getElementById('register-confirm-senha');

    if (pageType === 'login' && loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginMsg.textContent = '';
            
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            
            const users = loadUsers();
            const user = users.find(u => u.email === email && u.senha === senha);
            
            if (user) {
                loggedUserEmail = user.email;
                localStorage.setItem('loggedUserEmail', loggedUserEmail);
                loginForm.reset();
                window.location.href = 'index.html';
            } else {
                loginMsg.textContent = 'Erro: Email ou senha incorretos.';
            }
        });
    }

    if (pageType === 'register' && registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registerMsg.textContent = '';
            
            const email = document.getElementById('register-email').value;
            const senha = document.getElementById('register-senha').value;
            const confirmSenha = registerConfirmSenhaInput.value;
            
            if (senha !== confirmSenha) {
                registerMsg.textContent = 'Erro: As senhas não coincidem.';
                return;
            }

            const users = loadUsers();
            
            if (users.find(u => u.email === email)) {
                registerMsg.textContent = 'Erro: Este email já está registrado!';
                return;
            }
            
            users.push({ email, senha, id: Date.now() }); 
            saveUsers(users);
            
            alert('Registro concluído! Agora faça o login.');
            window.location.href = 'login.html';
        });
    }
}


// FUNÇÕES CRUD (Usado apenas no index.html)

// CREATE e UPDATE Agendamento
if (agendamentoForm) {
    agendamentoForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!loggedUserEmail) {
            alert('Você precisa estar logado para agendar!');
            return;
        }

        const data = dataInput.value;
        const hora = horaInput.value;
        const especialidade = especialidadeInput.value;
        const id = consultaIdInput.value;
        
        let appointments = loadAppointments();

        if (id) {
            const index = appointments.findIndex(c => c.id == id && c.user === loggedUserEmail);
            if (index > -1) {
                appointments[index] = { id: parseInt(id), user: loggedUserEmail, data, hora, especialidade };
                alert('Consulta atualizada com sucesso!');
            }
        } else {
            const novaConsulta = {
                id: Date.now(),
                user: loggedUserEmail,
                data,
                hora,
                especialidade
            };
            appointments.push(novaConsulta);
            alert('Consulta agendada com sucesso!');
        }

        saveAppointments(appointments);
        resetForm();
        renderizarConsultas();
        
        document.getElementById('consultas').scrollIntoView({ behavior: 'smooth' });
    });
}

// READ Agendamentos do Usuário Logado
function renderizarConsultas() {
    if (!tabelaBody) return;

    tabelaBody.innerHTML = '';
    
    const allAppointments = loadAppointments();
    const userAppointments = allAppointments.filter(c => c.user === loggedUserEmail);
    
    if (userAppointments.length === 0) {
        noConsultasDiv.style.display = 'block';
        return;
    }

    noConsultasDiv.style.display = 'none';

    userAppointments.forEach(consulta => {
        const row = tabelaBody.insertRow();
        
        row.insertCell().textContent = formatarData(consulta.data); 
        row.insertCell().textContent = consulta.hora;
        row.insertCell().textContent = consulta.especialidade;

        const acoesCell = row.insertCell();
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('btn');
        editButton.style.marginRight = '5px';
        editButton.style.background = '#f39c12';
        editButton.addEventListener('click', () => carregarParaEdicao(consulta.id));
        acoesCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('btn');
        deleteButton.style.background = '#e74c3c';
        deleteButton.addEventListener('click', () => deletarConsulta(consulta.id));
        acoesCell.appendChild(deleteButton);
    });
}

// UPDATE (Carregar Dados)
function carregarParaEdicao(id) {
    const allAppointments = loadAppointments();
    const consulta = allAppointments.find(c => c.id === id && c.user === loggedUserEmail);
    
    if (consulta) {
        dataInput.value = consulta.data;
        horaInput.value = consulta.hora;
        especialidadeInput.value = consulta.especialidade;
        consultaIdInput.value = consulta.id; 

        formButton.textContent = 'Salvar Edição';
        formButton.style.background = '#DAA520';
        cancelarEdicaoButton.style.display = 'inline-block';

        document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
    }
}

// DELETE
function deletarConsulta(id) {
    if (!loggedUserEmail) return;

    if (confirm('Tem certeza que deseja cancelar esta consulta?')) {
        let appointments = loadAppointments();
        appointments = appointments.filter(c => !(c.id === id && c.user === loggedUserEmail)); 
        
        saveAppointments(appointments);
        alert('Consulta cancelada com sucesso!');
        renderizarConsultas();
    }
}


// FUNÇÕES AUXILIARES
function resetForm() {
    if (agendamentoForm) agendamentoForm.reset();
    if (consultaIdInput) consultaIdInput.value = '';
    if (formButton) formButton.textContent = 'Confirmar Agendamento';
    if (formButton) formButton.style.background = '#DAA520';
    if (cancelarEdicaoButton) cancelarEdicaoButton.style.display = 'none';
}

if (cancelarEdicaoButton) cancelarEdicaoButton.addEventListener('click', resetForm);

function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Inicialização
document.addEventListener('DOMContentLoaded', checkAuthStatus);