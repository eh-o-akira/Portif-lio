// 🔥 CONFIGURAÇÃO DO FIREBASE (v9 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD08wjJ9rTqyZrzNWBJHLxsb1ztYElA3z8",
    authDomain: "meu-portifolio-21f88.firebaseapp.com",
    projectId: "meu-portifolio-21f88",
    storageBucket: "meu-portifolio-21f88.appspot.com",
    messagingSenderId: "806930819935",
    appId: "1:806930819935:web:3aa738a18026d925d7e4ea"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Elementos do DOM
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

const loginGoogleBtn = document.getElementById('login-google');
const loginEmailBtn = document.getElementById('login-email');
const toggleRegisterBtn = document.getElementById('toggle-register');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nomeInput = document.getElementById('nome');

const addButton = document.getElementById('add-project');
const modalAdd = document.getElementById('modal-add');
const form = document.getElementById('form-projeto');
const container = document.getElementById('projetos-container');

let isRegisterMode = false;
let projetosListener = null;

// Alternar entre login e cadastro
toggleRegisterBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    toggleRegisterBtn.textContent = isRegisterMode ? 'Já tenho conta' : 'Criar conta';
    nomeInput.style.display = isRegisterMode ? 'block' : 'none';
    loginEmailBtn.textContent = isRegisterMode ? 'Cadastrar' : 'Entrar';
});

// Login com Google
loginGoogleBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .catch(err => {
            alert('Erro: ' + err.message);
        });
});

// Login ou Cadastro com Email
loginEmailBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const nome = nomeInput.value;

    if (!email || !password) {
        alert('Preencha email e senha');
        return;
    }

    if (isRegisterMode) {
        if (!nome) {
            alert('Preencha seu nome');
            return;
        }
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Atualiza o displayName do usuário
                return updateProfile(userCredential.user, { displayName: nome });
            })
            .then(() => {
                alert('Conta criada!');
            })
            .catch(err => {
                alert('Erro: ' + err.message);
            });
    } else {
        signInWithEmailAndPassword(auth, email, password)
            .catch(err => {
                alert('Erro: ' + err.message);
            });
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Tela de login/logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        userName.textContent = user.displayName || user.email.split('@')[0];
        loginScreen.style.display = 'none';
        mainContent.style.display = 'block';
        if (projetosListener) projetosListener(); // Remove listener anterior
        projetosListener = listenProjetos();
    } else {
        loginScreen.style.display = 'flex';
        mainContent.style.display = 'none';
        if (projetosListener) projetosListener();
        projetosListener = null;
    }
});

// Listener de projetos
function listenProjetos() {
    if (!auth.currentUser) return null;

    const userRef = ref(database, 'users/' + auth.currentUser.uid + '/projetos');
    const unsubscribe = onValue(userRef, (snapshot) => {
        container.innerHTML = '';
        const data = snapshot.val();

        if (data) {
            Object.values(data)
                .sort((a, b) => b.id - a.id)
                .forEach(projeto => {
                    const card = document.createElement('div');
                    card.classList.add('projeto-card');
                    card.dataset.id = projeto.id;

                    let imgHTML = projeto.imagem ? `<img src="${projeto.imagem}" alt="${projeto.titulo}" />` : '';

                    card.innerHTML = `
                        ${imgHTML}
                        <h3>${projeto.titulo}</h3>
                        <p>${projeto.descricao}</p>
                        <div class="projeto-actions">
                            <button class="btn btn-outline btn-view" data-link="${projeto.link || ''}">Ver</button>
                            <button class="btn btn-edit" data-id="${projeto.id}">Editar</button>
                            <button class="btn btn-delete" data-id="${projeto.id}">Deletar</button>
                        </div>
                    `;
                    container.appendChild(card);
                });
        } else {
            const p = document.createElement('p');
            p.textContent = 'Nenhum projeto cadastrado.';
            container.appendChild(p);
        }

        // Eventos dos botões
        container.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = btn.getAttribute('data-link');
                if (link) {
                    window.open(link, '_blank');
                } else {
                    alert('Este projeto não possui link.');
                }
            });
        });
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const projeto = Object.values(data).find(p => String(p.id) === String(id));
                if (projeto) {
                    document.getElementById('titulo').value = projeto.titulo;
                    document.getElementById('imagem').value = projeto.imagem;
                    document.getElementById('link').value = projeto.link;
                    document.getElementById('descricao').value = projeto.descricao;
                    modalAdd.style.display = 'flex';
                    form.setAttribute('data-edit-id', id);
                }
            });
        });
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja deletar seu projeto?')) {
                    const userRef = ref(database, 'users/' + auth.currentUser.uid + '/projetos/' + id);
                    set(userRef, null);
                }
            });
        });
    });
    return unsubscribe;
}

// Botão "Adicionar Projeto"
addButton.addEventListener('click', () => {
    if (!auth.currentUser) {
        alert('Você precisa estar logado');
        return;
    }
    form.reset();
    modalAdd.style.display = 'flex';
});

// Fechar modal
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modalAdd.style.display = 'none';
    });
}

// Salvar projeto
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
        alert('Você precisa estar logado para adicionar projetos.');
        return;
    }

    const projeto = {
        id: form.getAttribute('data-edit-id') || Date.now(),
        titulo: document.getElementById('titulo').value,
        imagem: document.getElementById('imagem').value,
        link: document.getElementById('link').value,
        descricao: document.getElementById('descricao').value
    };

    const userRef = ref(database, 'users/' + auth.currentUser.uid + '/projetos/' + projeto.id);
    set(userRef, projeto)
        .then(() => {
            modalAdd.style.display = 'none';
            form.reset();
            form.removeAttribute('data-edit-id');
        })
        .catch(err => {
            alert('Erro ao salvar: ' + err.message);
        });
});